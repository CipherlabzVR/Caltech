import React, { useEffect, useRef } from "react";
import { Checkbox, FormControlLabel, Grid, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 400, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  FirstName: Yup.string().required("First Name is required"),
  LastName: Yup.string().required("Last Name is required"),
 NIC: Yup.string()
  .required("NIC is required")
  .matches(/^[0-9]+$/, "NIC must contain only numbers")
  .min(9, "NIC must be at least 9 digits")
  .max(12, "NIC must be at most 12 digits"),

  MobileNo: Yup.string().required("Mobile No is required"),
});

export default function AddDoctor({ fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  const handleOpen = async () => {
    setOpen(true);
  };


  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/Doctors/CreateDoctor`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + new
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              FirstName: "",
              LastName: "",
              NIC: "",
              MobileNo: "",
              Address1: "",
              Address2: "",
              Address3: "",
              IsActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, resetForm }) => (
              <Form>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Add Doctor
                    </Typography>
                  </Grid>
                  <Box sx={{maxHeight: '60vh', overflowY: 'scroll'}}>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          First Name
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="FirstName"
                          inputRef={inputRef}
                          error={touched.FirstName && Boolean(errors.FirstName)}
                          helperText={touched.FirstName && errors.FirstName}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Last Name
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="LastName"
                          error={touched.LastName && Boolean(errors.LastName)}
                          helperText={touched.LastName && errors.LastName}
                        />
                      </Grid>
                      <Grid item xs={12}>
                         <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          NIC
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="NIC"
                          error={touched.NIC && Boolean(errors.NIC)}
                          helperText={touched.NIC && errors.NIC}
                        />
                      </Grid>
                      <Grid item xs={12}>
                         <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Mobile No
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="MobileNo"
                          error={touched.MobileNo && Boolean(errors.MobileNo)}
                          helperText={touched.MobileNo && errors.MobileNo}
                        />
                      </Grid>
                      <Grid item xs={12}>
                         <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Address 1
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Address1"
                        />
                      </Grid>
                      <Grid item xs={12}>
                         <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Address 2
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Address2"
                        />
                      </Grid>
                      <Grid item xs={12}>
                         <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Address 3
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Address3"
                        />
                      </Grid>
                      <Grid item xs={12} mt={1} p={1}>
                        <FormControlLabel
                          control={
                            <Field
                              as={Checkbox}
                              name="IsActive"
                              checked={values.IsActive}
                              onChange={() =>
                                setFieldValue("IsActive", !values.IsActive)
                              }
                            />
                          }
                          label="Active"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                  <Grid container>
                    <Grid
                      display="flex"
                      justifyContent="space-between"
                      item
                      xs={12}
                      p={1}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        onClick={handleClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" size="small">
                        Save
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}

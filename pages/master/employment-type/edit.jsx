import React, { useEffect, useRef } from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";

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
  Code: Yup.string().trim().required("Code is required"),
  Name: Yup.string().trim().required("Name is required"),
});

export default function EditEmploymentType({ fetchItems, item }) {
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

  const handleOpen = () => {
    setOpen(true);
  };

  const handleSubmit = (values, { setSubmitting }) => {
    fetch(`${BASE_URL}/EmploymentType/UpdateEmploymentType`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode === 200) {
          toast.success(data.message);
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "An error occurred");
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <>
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Formik
            initialValues={{
              Id: item.id,
              Code: item.code || "",
              Name: item.name || "",
              IsPayrollEligible: item.isPayrollEligible || false,
              IsActive: item.isActive || false,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "500", mb: "5px" }}
                    >
                      Edit Employment Type
                    </Typography>
                  </Grid>
                  <Box sx={{ width: "100%", maxHeight: "60vh", overflowY: "auto", pr: 1 }}>
                    <Grid container spacing={2} mt={0}>
                      <Grid item xs={12}>
                        <Typography sx={{ fontWeight: "500", mb: "5px" }}>
                          Code
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Code"
                          inputRef={inputRef}
                          error={touched.Code && Boolean(errors.Code)}
                          helperText={touched.Code && errors.Code}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography sx={{ fontWeight: "500", mb: "5px" }}>
                          Name
                        </Typography>
                        <Field
                          as={TextField}
                          name="Name"
                          fullWidth
                          error={touched.Name && Boolean(errors.Name)}
                          helperText={touched.Name && errors.Name}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Field
                          as={FormControlLabel}
                          name="IsPayrollEligible" 
                          control={<Field as={Checkbox} name="IsPayrollEligible" />}
                          label="Payroll Eligible" 
                        />
                      </Grid>
                      <Grid item xs={12} sx={{mt: -1}}>
                        <Field
                          as={FormControlLabel}
                          name="IsActive"
                          control={<Field as={Checkbox} name="IsActive" />}
                          label="Is Active" 
                        />
                      </Grid>
                    </Grid>
                  </Box>
                  <Grid
                    container
                    display="flex"
                    justifyContent="flex-end"
                    gap={1}
                    item
                    xs={12}
                    mt={2}
                  >
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </Button>
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
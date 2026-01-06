import React, {  } from "react";
import { Grid, Typography } from "@mui/material";
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
  width: { lg: 450, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Name is required"),
  Email: Yup.string().required("Email is required"),
  PhoneNumber: Yup.string().required("Phone Number is required"),
});

export default function AddContact({ fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);

  const handleOpen = async () => {
    setOpen(true);
  };

  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/Contact/CreateContact`, {
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
        + add new
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
              Name: "",
              Description: "",
              Email: "",
              PhoneNumber: "",
              Package: "",
              Company: "",
              IsRead: false
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue, values, handleSubmit, touched, errors }) => (
              <Form onSubmit={handleSubmit}>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="h5" fontWeight={500}>
                      Contact
                    </Typography>
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Name
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Name"
                      size="small"
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Email
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Email"
                      size="small"
                      type="email"
                      error={touched.Email && Boolean(errors.Email)}
                      helperText={touched.Email && errors.Email}
                    />
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Phone Number
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="PhoneNumber"
                      size="small"
                      error={touched.PhoneNumber && Boolean(errors.PhoneNumber)}
                      helperText={touched.PhoneNumber && errors.PhoneNumber}
                    />
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Company
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Company"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Package
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Package"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Description
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Description"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained">
                      Save
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

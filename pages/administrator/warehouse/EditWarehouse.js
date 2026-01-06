import React, { useEffect, useRef, useState } from "react";
import { Grid, IconButton, MenuItem, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import getNext from "@/components/utils/getNext";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Name is required"),
  ContactPerson: Yup.string().required("Contact Person is required"),
  ContactNumber: Yup.string()
    .required("Mobile No is required")
    .matches(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
});

export default function EditWarehouse({ item,fetchItems, companies }) {
  const { data: code } = getNext(`12`);
  const [open, setOpen] = useState(false);
  const [warehouseCode, setWarehouseCode] = useState(null);
  const handleOpen = () => setOpen(true);
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

  useEffect(() => {
    if (code) {
      setWarehouseCode(code);
    }
  }, [code]);

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/Warehouse/UpdateWarehouse`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.result.message);
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
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              Id: item.id,
              Name: item.name || "",
              Code: item.code || "",
              AddressLine1: item.addressLine1 || "",
              AddressLine2: item.addressLine2 || "",
              AddressLine3: item.addressLine3 || "",
              CompanyId: item.companyId || "",
              ContactPerson: item.contactPerson || "",
              ContactNumber: item.contactNumber,
              MobileNo2: item.contactNumber2,
              MobileNo3: item.contactNumber3,
              Email1: item.email1,
              Email2: item.email2,
              Description: item.description,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "500",
                      mb: "12px",
                    }}
                  >
                    Edit Warehouse
                  </Typography>
                </Box>
                <Box sx={{ height: "60vh", overflowY: "scroll" }} my={2}>
                  <Grid spacing={1} container>
                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Warehouse Name
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        inputRef={inputRef}
                        name="Name"
                        size="small"
                        error={touched.Name && Boolean(errors.Name)}
                        helperText={touched.Name && errors.Name}
                      />
                    </Grid>
                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Code
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        inputRef={inputRef}
                        disabled
                        name="Code"
                        size="small"
                      />
                    </Grid>
                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Address Line 1
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        inputRef={inputRef}
                        name="AddressLine1"
                        size="small"
                      />
                    </Grid>
                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Address Line 2
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        inputRef={inputRef}
                        name="AddressLine2"
                        size="small"
                      />
                    </Grid>
                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Address Line 3
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        inputRef={inputRef}
                        name="AddressLine3"
                        size="small"
                      />
                    </Grid>
                    <Grid item lg={6} xs={12} mt={1}>
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
                        select
                        fullWidth
                        name="CompanyId"
                        size="small"
                      >
                        <MenuItem value="" disabled>
                          Select Company
                        </MenuItem>
                        {companies.length === 0 ? (
                          <MenuItem value="">No Companies Available</MenuItem>
                        ) : (
                          companies.map((item, index) => (
                            <MenuItem key={index} value={item.id}>
                              {item.code} - {item.name}
                            </MenuItem>
                          ))
                        )}
                      </Field>
                    </Grid>
                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Contact Person
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="ContactPerson"
                        size="small"
                        error={
                          touched.ContactPerson && Boolean(errors.ContactPerson)
                        }
                        helperText={
                          touched.ContactPerson && errors.ContactPerson
                        }
                      />
                    </Grid>
                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Mobile No 1
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="ContactNumber"
                        size="small"
                        error={
                          touched.ContactNumber && Boolean(errors.ContactNumber)
                        }
                        helperText={
                          touched.ContactNumber && errors.ContactNumber
                        }
                      />
                    </Grid>
                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Mobile No 2
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="MobileNo2"
                        size="small"
                      />
                    </Grid>
                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Mobile No 3
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="MobileNo3"
                        size="small"
                      />
                    </Grid>

                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Email 1
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Email1"
                        type="email"
                        size="small"
                        error={touched.Email1 && Boolean(errors.Email1)}
                        helperText={touched.Email1 && errors.Email1}
                      />
                    </Grid>
                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Email 2
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Email2"
                        type="email"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} mb={3} mt={1}>
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
                  </Grid>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleClose}
                    size="small"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" size="small">
                    Save
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}

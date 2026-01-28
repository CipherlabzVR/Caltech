import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import { Field, Form, Formik } from "formik";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import BASE_URL from "Base/api";

const validationSchema = Yup.object().shape({
  Title: Yup.string().required("Title is required"),
  FirstName: Yup.string().required("First Name is required"),
  LastName: Yup.string(),
  AddressLine1: Yup.string().required("Address Line 1 is required"),
  CustomerContactDetails: Yup.array().of(
    Yup.object().shape({
      ContactName: Yup.string().required("Contact Name is required"),
      EmailAddress: Yup.string().email("Invalid email address"),
      ContactNo: Yup.string().matches(/^\d+$/, "Contact No must contain only digits"),
    })
  ),
});

export default function CreateCustomerModal({ open, onClose, onCustomerCreated }) {
  const [titleList, setTitleList] = useState([]);
  const [contacts, setContacts] = useState([
    { ContactName: "", ContactNo: "", EmailAddress: "" },
  ]);

  const fetchTitleList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Customer/GetAllPersonTitle`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Title List");
      }

      const data = await response.json();
      setTitleList(data.result || []);
    } catch (error) {
      console.error("Error fetching Title List:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTitleList();
    }
  }, [open]);

  const handleAddContact = () => {
    const newContact = { ContactName: "", ContactNo: "", EmailAddress: "" };
    setContacts([...contacts, newContact]);
  };

  const handleRemoveContact = () => {
    if (contacts.length > 1) {
      const updatedContacts = contacts.slice(0, -1);
      setContacts(updatedContacts);
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      values.LastName = values.LastName ? values.LastName : "-";
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${BASE_URL}/Customer/CreateCustomer`, {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.statusCode === 200) {
        toast.success(data.message || "Customer created successfully!");
        resetForm();
        setContacts([{ ContactName: "", ContactNo: "", EmailAddress: "" }]);
        onClose();
        if (onCustomerCreated) {
          onCustomerCreated();
        }
      } else {
        toast.error(data.message || "Failed to create customer");
      }
    } catch (error) {
      toast.error(error.message || "Customer Creation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="create-customer-dialog"
      maxWidth="md"
      fullWidth
    >
      <div className="bg-black">
        <DialogTitle id="create-customer-dialog">Create New Customer</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              Title: "",
              FirstName: "",
              LastName: "",
              DisplayName: "",
              AddressLine1: "",
              AddressLine2: "",
              AddressLine3: "",
              Designation: "",
              Company: "",
              CustomerContactDetails: contacts.map(() => ({
                ContactName: "",
                EmailAddress: "",
                ContactNo: "",
              })),
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, isSubmitting }) => (
              <Form>
                <Grid container>
                  <Grid item xs={12}>
                    <Box sx={{ maxHeight: '50vh', overflowY: 'auto' }} mb={2} mt={1}>
                      <Grid container spacing={1}>
                        <Grid item lg={2} xs={12}>
                          <Typography component="label" sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}>
                            Title *
                          </Typography>
                          <FormControl fullWidth>
                            <InputLabel>Title</InputLabel>
                            <Select
                              label="Title"
                              name="Title"
                              value={values.Title}
                              onChange={(e) => setFieldValue("Title", e.target.value)}
                            >
                              {titleList.map((title, index) => (
                                <MenuItem key={index} value={title.title}>
                                  {title.title}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.Title && touched.Title && (
                              <Typography variant="body2" color="error">{errors.Title}</Typography>
                            )}
                          </FormControl>
                        </Grid>
                        <Grid item lg={5} xs={6}>
                          <Typography component="label" sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}>
                            First Name *
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name="FirstName"
                            error={touched.FirstName && Boolean(errors.FirstName)}
                            helperText={touched.FirstName && errors.FirstName}
                          />
                        </Grid>
                        <Grid item lg={5} xs={6}>
                          <Typography component="label" sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}>
                            Last Name
                          </Typography>
                          <Field as={TextField} fullWidth name="LastName" />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                          <Typography component="label" sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}>
                            Display Name
                          </Typography>
                          <Field as={TextField} fullWidth name="DisplayName" />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                          <Typography component="label" sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}>
                            Address Line 01 *
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name="AddressLine1"
                            error={touched.AddressLine1 && Boolean(errors.AddressLine1)}
                            helperText={touched.AddressLine1 && errors.AddressLine1}
                          />
                        </Grid>
                        <Grid item lg={6} xs={12}>
                          <Typography component="label" sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}>
                            Address Line 02
                          </Typography>
                          <Field as={TextField} fullWidth name="AddressLine2" />
                        </Grid>
                        <Grid item lg={6} xs={12}>
                          <Typography component="label" sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}>
                            Address Line 03
                          </Typography>
                          <Field as={TextField} fullWidth name="AddressLine3" />
                        </Grid>
                        <Grid item lg={6} xs={12}>
                          <Typography component="label" sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}>
                            Designation
                          </Typography>
                          <Field as={TextField} fullWidth name="Designation" />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                          <Typography component="label" sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}>
                            Organization
                          </Typography>
                          <Field as={TextField} fullWidth name="Company" />
                        </Grid>
                        
                        {contacts.map((contact, index) => (
                          <React.Fragment key={index}>
                            <Grid item xs={12} md={6} lg={4}>
                              <Typography component="label" sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}>
                                Contact Name *
                              </Typography>
                              <Field
                                as={TextField}
                                fullWidth
                                name={`CustomerContactDetails.${index}.ContactName`}
                                error={touched.CustomerContactDetails?.[index]?.ContactName && Boolean(errors.CustomerContactDetails?.[index]?.ContactName)}
                                helperText={touched.CustomerContactDetails?.[index]?.ContactName && errors.CustomerContactDetails?.[index]?.ContactName}
                              />
                            </Grid>
                            <Grid item xs={12} md={6} lg={4}>
                              <Typography component="label" sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}>
                                Contact No
                              </Typography>
                              <Field
                                as={TextField}
                                fullWidth
                                name={`CustomerContactDetails.${index}.ContactNo`}
                                error={touched.CustomerContactDetails?.[index]?.ContactNo && Boolean(errors.CustomerContactDetails?.[index]?.ContactNo)}
                                helperText={touched.CustomerContactDetails?.[index]?.ContactNo && errors.CustomerContactDetails?.[index]?.ContactNo}
                              />
                            </Grid>
                            <Grid item xs={12} md={6} lg={4}>
                              <Typography component="label" sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}>
                                Email
                              </Typography>
                              <Field
                                as={TextField}
                                fullWidth
                                name={`CustomerContactDetails.${index}.EmailAddress`}
                                error={touched.CustomerContactDetails?.[index]?.EmailAddress && Boolean(errors.CustomerContactDetails?.[index]?.EmailAddress)}
                                helperText={touched.CustomerContactDetails?.[index]?.EmailAddress && errors.CustomerContactDetails?.[index]?.EmailAddress}
                              />
                            </Grid>
                          </React.Fragment>
                        ))}
                        <Grid item display="flex" justifyContent="space-between" xs={12}>
                          <Button onClick={handleAddContact}>+ add contact</Button>
                          {contacts.length > 1 && (
                            <Button color="error" onClick={handleRemoveContact}>- Remove</Button>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>

                  <Grid item xs={12} display="flex" justifyContent="space-between">
                    <Button type="button" color="error" variant="contained" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Customer"}
                    </Button>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </div>
    </Dialog>
  );
}


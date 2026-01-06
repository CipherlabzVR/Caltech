import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import {
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import { Field, Form, Formik, setFieldValue } from "formik";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import BASE_URL from "Base/api";

const validationSchema = Yup.object().shape({
  Title: Yup.string().required("Title is required"),
  FirstName: Yup.string().required("First Name is required"),
  LastName: Yup.string(),
  AddressLine1: Yup.string().required("Address Line 1 is required"),
  AddressLine2: Yup.string(),
  AddressLine3: Yup.string(),
  Designation: Yup.string(),
  Company: Yup.string(),
  NIC: Yup.string().matches(
    /^\d{9}(\d{3})?$/,
    "NIC must be either 9 or 12 digits long"
  ),
  DateOfBirth: Yup.date(),
  CustomerContactDetails: Yup.array().of(
    Yup.object().shape({
      ContactName: Yup.string().required("Contact Name is required"),
      EmailAddress: Yup.string().email("Invalid email address"),
      ContactNo: Yup.string().matches(
        /^\d+$/,
        "Contact No must contain only digits"
      ),
    })
  ),
});

export default function EditCustomerDialog({ fetchItems, item }) {
  const [open, setOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState("paper");
  const [titleList, setTitleList] = useState([]);
  const initialLength = item.customerContactDetails.length;
  const initialContacts = Array.from({ length: initialLength }, (_, index) => ({
    ContactName: item.customerContactDetails[index]?.contactName || "",
    ContactNo: item.customerContactDetails[index]?.contactNo || "",
    EmailAddress: item.customerContactDetails[index]?.emailAddress || "",
  }));
  const [contacts, setContacts] = useState(initialContacts);
  const [birthdate, setBirthdate] = useState("");

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
        throw new Error("Failed to fetch Customer List");
      }

      const data = await response.json();
      setTitleList(data.result);
    } catch (error) {
      console.error("Error fetching Customer List:", error);
    }
  };

  useEffect(() => {
    fetchTitleList();
  }, []);

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
  const handleClickOpen = (scrollType) => () => {
    setOpen(true);
    setScroll(scrollType);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const descriptionElementRef = React.useRef(null);
  React.useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);

  const handleSubmit = (values) => {
    values.DateOfBirth = birthdate ? birthdate : "1000-01-01";
    values.LastName = values.LastName ? values.LastName : "-";

    if (values.CustomerContactDetails.length > contacts.length) {
      values.CustomerContactDetails = values.CustomerContactDetails.slice(
        0,
        contacts.length
      );
    }
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/Customer/UpdateCustomer`, {
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
          toast.success(data.message);
          setOpen(false);
          fetchItems();
          window.location.reload();
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(
          error.message || "Customer Creation failed. Please try again."
        );
      });
  };
  const calculateBirthdateFromNIC = (value) => {
    let year, number;
    if (value.length === 9 || value.length === 12) {
      if (value.length === 9) {
        year = parseInt(value.slice(0, 2), 10);
        number = parseInt(value.slice(2, 5), 10);
        let currentYear = new Date().getFullYear();
        let prefix = Math.floor(currentYear / 100) * 100;
        let threshold = 50;

        if (year <= threshold) {
          year = prefix + year;
        } else {
          year = prefix - 100 + year;
        }
      } else if (value.length === 12) {
        year = parseInt(value.slice(0, 4), 10);
        number = parseInt(value.slice(4, 7), 10);
      }

      if (number > 500) {
        number -= 500;
        if (!isLeapYear(year)) {
          number -= 1;
        }
      }

      const date = new Date(year, 0);
      date.setDate(number);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      setBirthdate(formattedDate);
      return formattedDate;
    }
  };

  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };
  const handleChange = (event) => {
    setBirthdate(event.target.value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <>
      <Tooltip title="Edit" placement="top">
        <IconButton
          onClick={handleClickOpen("paper")}
          aria-label="edit"
          size="small"
        >
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={handleClose}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
        maxWidth="md"
      >
        <div className="bg-black">
          <DialogTitle id="scroll-dialog-title">Edit Customer</DialogTitle>
          <DialogContent>
            <Formik
              initialValues={{
                Id: item.id || "",
                Title: item.title || "",
                FirstName: item.firstName || "",
                LastName: item.lastName || "",
                AddressLine1: item.addressLine1 || "",
                AddressLine2: item.addressLine2 || "",
                AddressLine3: item.addressLine3 || "",
                Designation: item.designation || "",
                Company: item.company || "",
                NIC: item.nic || "",
                DateOfBirth: formatDate(item.dateofBirth) || "",
                CustomerContactDetails: contacts.map((contact) => ({
                  ContactName: contact.ContactName,
                  EmailAddress: contact.EmailAddress,
                  ContactNo: contact.ContactNo,
                })),
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, values, setFieldValue }) => (
                <Form>
                  <Grid container spacing={2}>
                    <Grid item xs={12}></Grid>
                    <Grid item lg={2} xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        Title
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">
                          Title
                        </InputLabel>
                        <Select
                          labelId="demo-simple-select-label"
                          id="demo-simple-select"
                          label="Title"
                          name="Title"
                          value={values.Title}
                          onChange={(e) =>
                            setFieldValue("Title", e.target.value)
                          }
                        >
                          {titleList.map((title, index) => (
                            <MenuItem key={index} value={title.title}>
                              {title.title}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.Title && touched.Title && (
                          <Typography variant="body2" color="error">
                            {errors.Title}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item lg={5} xs={6}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        First Name
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
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
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
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        Address Line 01
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="AddressLine1"
                        error={
                          touched.AddressLine1 && Boolean(errors.AddressLine1)
                        }
                        helperText={touched.AddressLine1 && errors.AddressLine1}
                      />
                    </Grid>
                    <Grid item lg={6} xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        Address Line 02
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="AddressLine2"
                        error={
                          touched.AddressLine2 && Boolean(errors.AddressLine2)
                        }
                        helperText={touched.AddressLine2 && errors.AddressLine2}
                      />
                    </Grid>
                    <Grid item lg={6} xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        Address Line 03
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="AddressLine3"
                        error={
                          touched.AddressLine3 && Boolean(errors.AddressLine3)
                        }
                        helperText={touched.AddressLine3 && errors.AddressLine3}
                      />
                    </Grid>
                    <Grid lg={6} item xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
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
                        onChange={(e) => {
                          setFieldValue("NIC", e.target.value);
                          calculateBirthdateFromNIC(e.target.value);
                        }}
                      />
                    </Grid>
                    <Grid lg={6} item xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        Date Of Birth
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        type="date"
                        name="DateOfBirth"
                        error={
                          touched.DateOfBirth && Boolean(errors.DateOfBirth)
                        }
                        helperText={touched.DateOfBirth && errors.DateOfBirth}
                        value={birthdate}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item lg={6} xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        Designation
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Designation"
                        error={
                          touched.Designation && Boolean(errors.Designation)
                        }
                        helperText={touched.Designation && errors.Designation}
                      />
                    </Grid>
                    <Grid item lg={6} xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        Organization
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Company"
                        error={touched.Company && Boolean(errors.Company)}
                        helperText={touched.Company && errors.Company}
                      />
                    </Grid>
                    {contacts.map((contact, index) => (
                      <React.Fragment key={index}>
                        <Grid item xs={12} md={6} lg={4}>
                          <Typography
                            component="label"
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              mb: "10px",
                              display: "block",
                            }}
                          >
                            Contact Name
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name={`CustomerContactDetails.${index}.ContactName`}
                            error={
                              touched.CustomerContactDetails?.[index]
                                ?.ContactName &&
                              Boolean(
                                errors.CustomerContactDetails?.[index]
                                  ?.ContactName
                              )
                            }
                            helperText={
                              touched.CustomerContactDetails?.[index]
                                ?.ContactName &&
                              errors.CustomerContactDetails?.[index]
                                ?.ContactName
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={6} lg={4}>
                          <Typography
                            component="label"
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              mb: "10px",
                              display: "block",
                            }}
                          >
                            Contact No
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name={`CustomerContactDetails.${index}.ContactNo`}
                            error={
                              touched.CustomerContactDetails?.[index]
                                ?.ContactNo &&
                              Boolean(
                                errors.CustomerContactDetails?.[index]
                                  ?.ContactNo
                              )
                            }
                            helperText={
                              touched.CustomerContactDetails?.[index]
                                ?.ContactNo &&
                              errors.CustomerContactDetails?.[index]?.ContactNo
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={6} lg={4}>
                          <Typography
                            component="label"
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              mb: "10px",
                              display: "block",
                            }}
                          >
                            Email
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name={`CustomerContactDetails.${index}.EmailAddress`}
                            error={
                              touched.CustomerContactDetails?.[index]
                                ?.EmailAddress &&
                              Boolean(
                                errors.CustomerContactDetails?.[index]
                                  ?.EmailAddress
                              )
                            }
                            helperText={
                              touched.CustomerContactDetails?.[index]
                                ?.EmailAddress &&
                              errors.CustomerContactDetails?.[index]
                                ?.EmailAddress
                            }
                          />
                        </Grid>
                      </React.Fragment>
                    ))}
                    <Grid
                      item
                      display="flex"
                      justifyContent="space-between"
                      xs={12}
                    >
                      <Button onClick={handleAddContact}>+ add new</Button>
                      {contacts.length > 1 && (
                        <Button color="error" onClick={handleRemoveContact}>
                          - Remove
                        </Button>
                      )}
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                          textTransform: "capitalize",
                          borderRadius: "8px",
                          fontWeight: "500",
                          fontSize: "16px",
                          padding: "12px 10px",
                          color: "#fff !important",
                        }}
                      >
                        Update Customer
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </div>
      </Dialog>
    </>
  );
}

import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import AddIcon from "@mui/icons-material/Add";
import Grid from "@mui/material/Grid";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import BASE_URL from "Base/api";

const validationSchema = Yup.object().shape({
  FirstName: Yup.string().required("First Name is required"),
  LastName: Yup.string().required("Last Name is required"),
  Email: Yup.string().email("Invalid email").required("Email is required"),
  Address: Yup.string().required("Address is required"),
  MobileNumber: Yup.string()
    .matches(/^[0-9]{10}$/, "Mobile Number must be a 10-digit number")
    .required("Mobile Number is required"),
  Password: Yup.string()
    .required("Password is required")
    .matches(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/,
      "Password must contain at least 8 characters, including at least one lowercase letter, one uppercase letter, one number, and one special character (!@#$%^&*)"
    ),
  ConfirmPassword: Yup.string()
    .required("Confirm Password is required")
    .oneOf([Yup.ref("Password"), null], "Passwords must match"),
  UserType: Yup.number().required("User Type is required"),
  WarehouseId: Yup.string().required("Warehouse is required"),
  UserRole: Yup.string().required("User Role is required"),
  SalesPersonId: Yup.number().when("UserType", {
    is: 24,
    then: (schema) => schema.required("Sales Person is required."),
    otherwise: (schema) => schema.nullable(),
  }),
  CustomerId: Yup.number().when("UserType", {
    is: 25, // HelpDeskCustomer
    then: (schema) => schema.required("Customer is required."),
    otherwise: (schema) => schema.nullable(),
  }),
});

export default function AddUserDialog({ fetchItems, warehouses, roles }) {
  const [open, setOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState("paper");
  const [userTypes, setUserTypes] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [customers, setCustomers] = useState([]);

  const handleClickOpen = (scrollType) => () => {
    setOpen(true);
    setScroll(scrollType);
    fetchUserTypes();
    fetchSalesPersons();
    fetchCustomers();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const verificationLink = `${baseUrl}/userverified`;

  const handleSubmit = (values) => {

    fetch(`${BASE_URL}/User/SignUp`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
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
        toast.error(error.message || "Sign up failed. Please try again.");
      });
  };

  const fetchUserTypes = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/User/GetAllUserTypes`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setUserTypes(data);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  const fetchSalesPersons = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/SalesPerson/GetAllSalesPersonCRM`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      if (data.statusCode === 200 && data.result) {
        setSalesPersons(data.result);
      }
    } catch (error) {
      console.error("Error fetching sales persons:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Customer/GetAllCustomer`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      if (data.statusCode === 200 && data.result) {
        setCustomers(data.result);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  return (
    <>
      <ToastContainer />
      <Button onClick={handleClickOpen("paper")} variant="outlined">
        <AddIcon
          sx={{
            position: "relative",
            top: "-2px",
          }}
          className="mr-5px"
        />{" "}
        Create New User
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">Create User</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              FirstName: "",
              LastName: "",
              Email: "",
              Address: "",
              MobileNumber: "",
              Password: "",
              ConfirmPassword: "",
              UserType: null,
              UserRole: null,
              IsAgeVerified: 1,
              EmailConfirmed: 0,
              WarehouseId: "",
              SalesPersonId: null,
              CustomerId: null,
              VerifyLink: verificationLink
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, setFieldValue, values }) => (
              <Form>
                <Grid container spacing={2}>
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
                      Email
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Email"
                      error={touched.Email && Boolean(errors.Email)}
                      helperText={touched.Email && errors.Email}
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
                      Address
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Address"
                      error={touched.Address && Boolean(errors.Address)}
                      helperText={touched.Address && errors.Address}
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
                      Mobile Number
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="MobileNumber"
                      error={
                        touched.MobileNumber && Boolean(errors.MobileNumber)
                      }
                      helperText={touched.MobileNumber && errors.MobileNumber}
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
                      Password
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Password"
                      type="password"
                      error={touched.Password && Boolean(errors.Password)}
                      helperText={touched.Password && errors.Password}
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
                      Confirm Password
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="ConfirmPassword"
                      type="password"
                      error={
                        touched.ConfirmPassword &&
                        Boolean(errors.ConfirmPassword)
                      }
                      helperText={
                        touched.ConfirmPassword && errors.ConfirmPassword
                      }
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Warehouse
                    </Typography>
                    <FormControl fullWidth>
                      <Field as={TextField} select fullWidth name="WarehouseId">
                        {warehouses.length === 0 ? (
                          <MenuItem disabled>No Warehouses Available</MenuItem>
                        ) : (
                          warehouses.map((warehouse, index) => (
                            <MenuItem key={index} value={warehouse.id}>
                              {warehouse.code}-{warehouse.name}
                            </MenuItem>
                          ))
                        )}
                      </Field>
                      {touched.WarehouseId && Boolean(errors.WarehouseId) && (
                        <Typography variant="caption" color="error">
                          {errors.WarehouseId}
                        </Typography>
                      )}
                    </FormControl>
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
                      User Role
                    </Typography>
                    <FormControl fullWidth>
                      <Field as={TextField} select fullWidth name="UserRole">
                        {roles.length === 0 ? (
                          <MenuItem disabled>No Roles Available</MenuItem>
                        ) : (
                          roles.map((role, index) => (
                            <MenuItem key={index} value={role.id}>
                              {role.name}
                            </MenuItem>
                          ))
                        )}
                      </Field>
                      {touched.UserRole && Boolean(errors.UserRole) && (
                        <Typography variant="caption" color="error">
                          {errors.UserRole}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      as="h5"
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "12px",
                      }}
                    >
                      User Type
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel id="demo-simple-select-label">
                        User Type
                      </InputLabel>
                      <Field
                        as={Select}
                        labelId="category-select-label"
                        id="category-select"
                        name="UserType"
                        label="User Type"
                        value={values.UserType}
                        onChange={(e) => {
                          const newUserType = e.target.value;
                          setFieldValue("UserType", newUserType);
                          if (newUserType !== 24) {
                            setFieldValue("SalesPersonId", null);
                          }
                          if (newUserType !== 25) { // HelpDeskCustomer
                            setFieldValue("CustomerId", null);
                          }
                        }}
                      >
                        {userTypes.length === 0 ? (
                          <MenuItem disabled color="error">
                            No User Types Available
                          </MenuItem>
                        ) : (
                          userTypes.map((type, index) => (
                            <MenuItem
                              key={index}
                              value={type.id}
                            >
                              {type.name}
                            </MenuItem>
                          ))
                        )}
                      </Field>
                      {touched.UserType && Boolean(errors.UserType) && (
                        <Typography variant="caption" color="error">
                          {errors.UserType}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  {values.UserType === 24 && (
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
                        Sales Person
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel id="sales-person-select-label">
                          Sales Person
                        </InputLabel>
                        <Field
                          as={Select}
                          labelId="sales-person-select-label"
                          id="sales-person-select"
                          name="SalesPersonId"
                          label="Sales Person"
                          value={values.SalesPersonId}
                          onChange={(e) =>
                            setFieldValue("SalesPersonId", e.target.value)
                          }
                        >
                          {salesPersons.length === 0 ? (
                            <MenuItem disabled color="error">
                              No Sales Persons Available
                            </MenuItem>
                          ) : (
                            salesPersons.map((person, index) => (
                              <MenuItem
                                key={index}
                                value={person.id}
                              >
                                {person.code} - {person.name}
                              </MenuItem>
                            ))
                          )}
                        </Field>
                        {touched.SalesPersonId && Boolean(errors.SalesPersonId) && (
                          <Typography variant="caption" color="error">
                            {errors.SalesPersonId}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                  )}
                  {values.UserType === 25 && ( // HelpDeskCustomer
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
                        As Customer
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel id="customer-select-label">
                          Customer
                        </InputLabel>
                        <Field
                          as={Select}
                          labelId="customer-select-label"
                          id="customer-select"
                          name="CustomerId"
                          label="Customer"
                          value={values.CustomerId}
                          onChange={(e) =>
                            setFieldValue("CustomerId", e.target.value)
                          }
                        >
                          {customers.length === 0 ? (
                            <MenuItem disabled color="error">
                              No Customers Available
                            </MenuItem>
                          ) : (
                            customers.map((customer, index) => {
                              const displayName = customer.displayName || customer.DisplayName;
                              const firstName = customer.firstName || customer.FirstName || '';
                              const lastName = customer.lastName || customer.LastName || '';
                              const customerName = displayName || `${firstName} ${lastName}`.trim() || `Customer ${customer.id}`;
                              return (
                                <MenuItem
                                  key={index}
                                  value={customer.id}
                                >
                                  {customerName}
                                </MenuItem>
                              );
                            })
                          )}
                        </Field>
                        {touched.CustomerId && Boolean(errors.CustomerId) && (
                          <Typography variant="caption" color="error">
                            {errors.CustomerId}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                  )}
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
                      Create User
                    </Button>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
    </>
  );
}

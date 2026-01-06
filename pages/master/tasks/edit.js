import React, { useEffect, useRef, useState } from "react";
import { Checkbox, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Select, Tooltip, Typography } from "@mui/material";
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
  Name: Yup.string().required("Name is required"),
  UserType: Yup.string().required("User Type is required"),
   OrderNumber: Yup.number()
      .typeError("Order Number must be a number")
      .required("Order Number is required")
      .positive("Order Number must be positive")
      .integer("Order Number must be an integer"),
});

export default function EditTask({ fetchItems, item }) {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);
  const [userTypes, setUserTypes] = useState([]);
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
    fetchUserTypes();
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

  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/Tasks/UpdateTask`, {
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
              id: item.id,
              Name: item.name || "",
              Description: item.description || "",
              OrderNumber: item.orderNumber || null,
              UserType: item.userTypeId || null,
              IsActive: item.isActive || true,
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
                      Edit Task
                    </Typography>
                  </Grid>
                  <Box >
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Name
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Name"
                          inputRef={inputRef}
                          error={touched.Name && Boolean(errors.Name)}
                          helperText={touched.Name && errors.Name}
                        />
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
                            onChange={(e) =>
                              setFieldValue("UserType", e.target.value)
                            }
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
                      <Grid item xs={12}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Description
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Description"
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
                          Order Number
                        </Typography>

                        <Field
                          as={TextField}
                          fullWidth
                          name="OrderNumber"
                          type="number"
                          error={touched.OrderNumber && Boolean(errors.OrderNumber)}
                          helperText={touched.OrderNumber && errors.OrderNumber}
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

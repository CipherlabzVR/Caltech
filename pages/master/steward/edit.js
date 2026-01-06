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
import useApi from "@/components/utils/useApi";

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
  Title: Yup.string().required("Title is required"),
  FirstName: Yup.string().required("First Name is required"),
  Mobile: Yup.string().required("Mobile No is required"),
});

export default function EditSteward({ fetchItems, item }) {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);
  const [titleList, setTitleList] = useState([]);

  const { data: titles } = useApi("/Customer/GetAllPersonTitle");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
    if (titles) {
      setTitleList(titles);
    }
  }, [open, titles]);

  const handleOpen = async () => {
    setOpen(true);
  };

  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/Steward/UpdateSteward`, {
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
              Id: item.id,
              Title: item.title || "",
              FirstName: item.firstName || "",
              LastName: item.lastName || "",
              Mobile: item.mobile || "",
              Email: item.email || "",
              IsActive: item.isActive || false,
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
                      Edit Steward
                    </Typography>
                  </Grid>
                  <Box sx={{ maxHeight: '60vh', overflowY: 'scroll' }}>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
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
                              <MenuItem key={index} value={title.id}>
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
                          name="Mobile"
                          error={touched.Mobile && Boolean(errors.Mobile)}
                          helperText={touched.Mobile && errors.Mobile}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Email
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Email"
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

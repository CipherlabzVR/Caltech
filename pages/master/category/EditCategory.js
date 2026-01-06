import React, { useState } from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  styled,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import "react-toastify/dist/ReactToastify.css";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import BASE_URL from "Base/api";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Category Name is required"),
});

export default function EditCategory({ fetchItems, category, IsEcommerceWebSiteAvailable }) {
  const [open, setOpen] = React.useState(false);
  const [image, setImage] = useState("");
  const [file, setFile] = useState(null);
  const handleOpen = () => {
    setOpen(true);
    setImage(category.categoryImage ? category.categoryImage : "");
  };

  const handleClose = () => {
    setOpen(false);
    setImage("");
    setFile(null)
  };

  const handleSubmit = (values) => {
    const formData = new FormData();

    formData.append("Id", values.Id);
    formData.append("Name", values.Name);
    formData.append("IsActive", values.IsActive);
    formData.append("IsWebView", values.IsWebView);
    formData.append("File", file ? file : null);

    fetch(`${BASE_URL}/Category/UpdateCategory`, {
      method: "POST",
      body: formData,
      headers: {
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
              Id: category.id,
              Name: category.name || "",
              IsActive: category.isActive ?? true,
              IsWebView: category.isWebView
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Box mt={2}>
                  <Grid container>
                    <Grid item xs={12}>
                      <Typography
                        as="h5"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "12px",
                        }}
                      >
                        Category Name
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Name"
                        error={touched.Name && Boolean(errors.Name)}
                        helperText={touched.Name && errors.Name}
                      />
                    </Grid>
                    <Grid item xs={12} lg={6} mt={2}>
                      <Typography
                        as="h5"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "12px",
                        }}
                      >
                        Category Image
                      </Typography>
                      <Button
                        component="label"
                        variant="contained"
                        tabIndex={-1}
                        startIcon={<CloudUploadIcon />}
                      >
                        Upload Image
                        <VisuallyHiddenInput
                          type="file"
                          onChange={(event) => {
                            var file = event.target.files[0]
                            setFile(file);
                            setImage(URL.createObjectURL(file));
                          }}
                          multiple
                        />
                      </Button>
                    </Grid>
                    {image != "" ?
                      <Grid item xs={12} lg={6} my={1} display="flex" justifyContent="center">
                        <Box sx={{ p: 2, border: '1px solid #e5e5e5', borderRadius: '10px' }}>
                          <Box sx={{ width: 150, height: 150, backgroundSize: 'cover', backgroundImage: `url(${image})` }}></Box>
                        </Box>
                      </Grid>
                      : ""}
                    <Grid item xs={12}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} lg={6} mt={1}>
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

                        {IsEcommerceWebSiteAvailable && (
                          <Grid item xs={12} lg={6} mt={1}>
                            <FormControlLabel
                              control={
                                <Field
                                  as={Checkbox}
                                  name="IsWebView"
                                  checked={values.IsWebView}
                                  onChange={() => setFieldValue("IsWebView", !values.IsWebView)}
                                />
                              }
                              label="Show in web"
                            />
                          </Grid>
                        )}
                      </Grid>
                    </Grid>

                  </Grid>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Button
                    type="submit"
                    variant="contained"
                    onClick={handleClose}
                    color="error"
                    sx={{
                      mt: 2,
                      textTransform: "capitalize",
                      borderRadius: "8px",
                      fontWeight: "500",
                      fontSize: "13px",
                      padding: "12px 20px",
                      color: "#fff !important",
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      mt: 2,
                      textTransform: "capitalize",
                      borderRadius: "8px",
                      fontWeight: "500",
                      fontSize: "13px",
                      padding: "12px 20px",
                      color: "#fff !important",
                    }}
                  >
                    Update
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

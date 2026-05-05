import React, { useEffect, useRef, useState } from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import CloseIcon from "@mui/icons-material/Close";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 600, md: 550, xs: 380 },
  maxHeight: "90vh",
  overflow: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  Title: Yup.string().required("Title is required"),
});

export default function AddHeroBanner({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSelectedFiles([]);
    setPreviews([]);
  };

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [open]);

  const handleFilesSelected = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
    event.target.value = "";
  };

  const handleRemoveImage = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (values, { resetForm }) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("Title", values.Title);
    formData.append("Description", values.Description);
    formData.append("DisplayOrder", values.DisplayOrder);
    formData.append("IsActive", values.IsActive);

    selectedFiles.forEach((file) => {
      formData.append("BannerImages", file);
    });

    fetch(`${BASE_URL}/ECommerce/CreateHeroBanner`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          resetForm();
          setSelectedFiles([]);
          setPreviews([]);
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
              Title: "",
              Description: "",
              DisplayOrder: 0,
              IsActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Box>
                  <Grid spacing={1} container>
                    <Grid item xs={12}>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: "500", mb: "12px" }}
                      >
                        Add Hero Banner
                      </Typography>
                    </Grid>

                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}
                      >
                        Title
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        inputRef={inputRef}
                        name="Title"
                        size="small"
                        error={touched.Title && Boolean(errors.Title)}
                        helperText={touched.Title && errors.Title}
                      />
                    </Grid>

                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}
                      >
                        Description
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Description"
                        size="small"
                        multiline
                        rows={2}
                      />
                    </Grid>

                    <Grid item xs={6} mt={1}>
                      <Typography
                        sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}
                      >
                        Display Order
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        type="number"
                        name="DisplayOrder"
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={6} mt={1} display="flex" alignItems="end">
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

                    <Grid item xs={12} mt={2}>
                      <Typography
                        sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}
                      >
                        Banner Images
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose Images
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handleFilesSelected}
                      />
                    </Grid>

                    {previews.length > 0 && (
                      <Grid item xs={12} mt={1}>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {previews.map((src, index) => (
                            <Box
                              key={index}
                              sx={{
                                position: "relative",
                                width: 120,
                                height: 80,
                                borderRadius: 1,
                                overflow: "hidden",
                                border: "1px solid",
                                borderColor: "divider",
                              }}
                            >
                              <img
                                src={src}
                                alt={`Preview ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveImage(index)}
                                sx={{
                                  position: "absolute",
                                  top: 0,
                                  right: 0,
                                  bgcolor: "rgba(0,0,0,0.6)",
                                  color: "white",
                                  "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                                  p: "2px",
                                }}
                              >
                                <CloseIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
                <Box display="flex" mt={2} justifyContent="space-between">
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

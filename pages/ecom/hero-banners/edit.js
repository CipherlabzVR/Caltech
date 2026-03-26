import React, { useEffect, useRef, useState } from "react";
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
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import CloseIcon from "@mui/icons-material/Close";
import BASE_URL from "Base/api";

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

export default function EditHeroBanner({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);

  const handleOpen = () => {
    setExistingImages(item.bannerImages || []);
    setRemovedImageIds([]);
    setNewFiles([]);
    setNewPreviews([]);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setNewFiles([]);
    setNewPreviews([]);
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
    setNewFiles((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewPreviews((prev) => [...prev, ...previews]);
    event.target.value = "";
  };

  const handleRemoveNewImage = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveExistingImage = (imageId) => {
    setRemovedImageIds((prev) => [...prev, imageId]);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("Id", values.Id);
    formData.append("Title", values.Title);
    formData.append("Description", values.Description);
    formData.append("DisplayOrder", values.DisplayOrder);
    formData.append("IsActive", values.IsActive);
    formData.append("ImageIdsToRemove", removedImageIds.join(","));

    newFiles.forEach((file) => {
      formData.append("BannerImages", file);
    });

    fetch(`${BASE_URL}/ECommerce/UpdateHeroBanner`, {
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
              Title: item.title,
              Description: item.description || "",
              DisplayOrder: item.displayOrder || 0,
              IsActive: item.isActive,
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
                        Edit Hero Banner
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
                        Add More Images
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

                    {(existingImages.length > 0 || newPreviews.length > 0) && (
                      <Grid item xs={12} mt={1}>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {existingImages.map((img) => (
                            <Box
                              key={`existing-${img.id}`}
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
                                src={img.imgUrl}
                                alt={`Banner ${img.id}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleRemoveExistingImage(img.id)
                                }
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
                          {newPreviews.map((src, index) => (
                            <Box
                              key={`new-${index}`}
                              sx={{
                                position: "relative",
                                width: 120,
                                height: 80,
                                borderRadius: 1,
                                overflow: "hidden",
                                border: "1px solid",
                                borderColor: "primary.main",
                              }}
                            >
                              <img
                                src={src}
                                alt={`New ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveNewImage(index)}
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

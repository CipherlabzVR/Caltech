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
  width: { lg: 640, md: 560, xs: 380 },
  maxHeight: "90vh",
  overflow: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  Title: Yup.string().required("Title is required"),
  Slug: Yup.string().required("Slug is required"),
});

function formatDateTimeLocal(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditBlogPost({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [newFile, setNewFile] = useState(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState(null);
  const [removeFeaturedImage, setRemoveFeaturedImage] = useState(false);

  const handleOpen = () => {
    setNewFile(null);
    if (newPreviewUrl) URL.revokeObjectURL(newPreviewUrl);
    setNewPreviewUrl(null);
    setRemoveFeaturedImage(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewFile(null);
    if (newPreviewUrl) URL.revokeObjectURL(newPreviewUrl);
    setNewPreviewUrl(null);
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

  const handleFileSelected = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewFile(file);
      setNewPreviewUrl(URL.createObjectURL(file));
      setRemoveFeaturedImage(false);
    }
    event.target.value = "";
  };

  const handleRemoveNewImage = () => {
    setNewFile(null);
    if (newPreviewUrl) URL.revokeObjectURL(newPreviewUrl);
    setNewPreviewUrl(null);
  };

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("Id", values.Id);
    formData.append("Title", values.Title);
    formData.append("Slug", values.Slug);
    formData.append("Content", values.Content || "");
    formData.append("Excerpt", values.Excerpt || "");
    formData.append("DisplayOrder", values.DisplayOrder);
    formData.append("IsActive", values.IsActive);
    formData.append("RemoveFeaturedImage", removeFeaturedImage);
    if (values.PublishDate) {
      formData.append("PublishDate", values.PublishDate);
    }
    if (newFile) {
      formData.append("FeaturedImage", newFile);
    }

    fetch(`${BASE_URL}/ECommerce/UpdateBlogPost`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode === 200) {
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

  const showExistingImage =
    item.featuredImageUrl && !removeFeaturedImage && !newPreviewUrl;

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
              Slug: item.slug,
              Content: item.content || "",
              Excerpt: item.excerpt || "",
              DisplayOrder: item.displayOrder ?? 0,
              IsActive: item.isActive,
              PublishDate: formatDateTimeLocal(item.publishDate),
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
                        Edit Blog Post
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
                        Slug (URL-friendly)
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Slug"
                        size="small"
                        error={touched.Slug && Boolean(errors.Slug)}
                        helperText={touched.Slug && errors.Slug}
                      />
                    </Grid>

                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}
                      >
                        Excerpt
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Excerpt"
                        size="small"
                        multiline
                        rows={2}
                      />
                    </Grid>

                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}
                      >
                        Content
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Content"
                        size="small"
                        multiline
                        rows={6}
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

                    <Grid item xs={6} mt={1}>
                      <Typography
                        sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}
                      >
                        Publish Date (optional)
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        type="datetime-local"
                        name="PublishDate"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12} mt={1} display="flex" alignItems="end">
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
                        Featured Image
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {showExistingImage || newPreviewUrl
                          ? "Replace Image"
                          : "Choose Image"}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleFileSelected}
                      />
                      {showExistingImage && (
                        <Button
                          size="small"
                          color="error"
                          sx={{ ml: 1 }}
                          onClick={() => setRemoveFeaturedImage(true)}
                        >
                          Remove current
                        </Button>
                      )}
                    </Grid>

                    {(showExistingImage || newPreviewUrl) && (
                      <Grid item xs={12} mt={1}>
                        <Box
                          sx={{
                            position: "relative",
                            width: 160,
                            height: 100,
                            borderRadius: 1,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <img
                            src={newPreviewUrl || item.featuredImageUrl}
                            alt="Featured"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          {newPreviewUrl && (
                            <IconButton
                              size="small"
                              onClick={handleRemoveNewImage}
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
                          )}
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

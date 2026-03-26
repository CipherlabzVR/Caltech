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

export default function AddBlogPost({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const [featuredFile, setFeaturedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFeaturedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
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
      setFeaturedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
    event.target.value = "";
  };

  const handleRemoveImage = () => {
    setFeaturedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleSubmit = (values, { resetForm }) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("Title", values.Title);
    formData.append("Slug", values.Slug);
    formData.append("Content", values.Content || "");
    formData.append("Excerpt", values.Excerpt || "");
    formData.append("DisplayOrder", values.DisplayOrder);
    formData.append("IsActive", values.IsActive);
    if (values.PublishDate) {
      formData.append("PublishDate", values.PublishDate);
    }
    if (featuredFile) {
      formData.append("FeaturedImage", featuredFile);
    }

    fetch(`${BASE_URL}/ECommerce/CreateBlogPost`, {
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
          handleClose();
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
              Slug: "",
              Content: "",
              Excerpt: "",
              DisplayOrder: 0,
              IsActive: true,
              PublishDate: "",
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
                        Add Blog Post
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
                        placeholder="Blog post title"
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
                        placeholder="my-blog-post"
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
                        placeholder="Short summary for listings"
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
                        placeholder="Full blog content (HTML or plain text)"
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
                        Choose Image
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleFileSelected}
                      />
                    </Grid>

                    {previewUrl && (
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
                            src={previewUrl}
                            alt="Featured preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={handleRemoveImage}
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

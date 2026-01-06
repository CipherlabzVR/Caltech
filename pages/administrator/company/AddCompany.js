import React, { useEffect, useRef, useState } from "react";
import { Grid, Typography, MenuItem, Tabs, Tab, CircularProgress } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});


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
  Code: Yup.string().required("Code is required"),
  ContactPerson: Yup.string().required("Contact Person is required"),
  ContactNumber: Yup.string()
    .required("Mobile No is required")
    .matches(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
});

export default function AddCompany({ fetchItems }) {
  const [errors, setErrors] = useState([]);
  const [image, setImage] = useState("");
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [letterheadImage, setLetterheadImage] = useState("");
  const [letterheadFile, setLetterheadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleOpen = async () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setTabIndex(0);
  };
  const handleTabChange = (event, newValue) => setTabIndex(newValue);

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

  const validateA4Size = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        // A4 aspect ratio: 210mm x 297mm = 0.707 (width/height)
        // Allow ±5% tolerance
        const aspectRatio = width / height;
        const a4Ratio = 210 / 297; // 0.707
        const tolerance = 0.05;
        
        if (Math.abs(aspectRatio - a4Ratio) <= tolerance) {
          resolve(true);
        } else {
          reject(new Error(`Image must be A4 size (210mm x 297mm / 2480 x 3508 px at 300 DPI). Current dimensions: ${width} x ${height}px`));
        }
      };
      img.onerror = () => reject(new Error("Invalid image file"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLetterheadChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      await validateA4Size(file);
      setLetterheadFile(file);
      setLetterheadImage(URL.createObjectURL(file));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (values) => {
    const formData = new FormData();

    formData.append("Code", values.Code);
    formData.append("Name", values.Name);
    formData.append("Description", values.Description);
    formData.append("ContactPerson", values.ContactPerson);
    formData.append("ContactNumber", values.ContactNumber);
    formData.append("CompanyLogo", logo ? logo : null);
    formData.append("LetterHeadImage", letterheadFile ? letterheadFile : null);
    formData.append("LandingPage", values.LandingPage);

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/Company/CreateCompany`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.statusCode == 200) {
        toast.success(data.message);
        setOpen(false);
        fetchItems();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + new company
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Basic" />
            <Tab label="Letterhead" />
          </Tabs>
          <Formik
            initialValues={{
              Name: "",
              Code: "",
              ContactPerson: "",
              ContactNumber: "",
              Description: "",
              LandingPage: "1",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                {tabIndex === 0 && (
                  <>
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: "500",
                          mb: "12px",
                        }}
                      >
                        Add Company
                      </Typography>
                    </Box>
                    <Box sx={{ height: "60vh", overflowY: "scroll" }} my={2}>
                  <Grid spacing={1} container>
                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Name
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        inputRef={inputRef}
                        name="Name"
                        size="small"
                        error={touched.Name && Boolean(errors.Name)}
                        helperText={touched.Name && errors.Name}
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
                        Code
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Code"
                        size="small"
                        error={touched.Code && Boolean(errors.Code)}
                        helperText={touched.Code && errors.Code}
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
                        Contact Person
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="ContactPerson"
                        size="small"
                        error={
                          touched.ContactPerson && Boolean(errors.ContactPerson)
                        }
                        helperText={
                          touched.ContactPerson && errors.ContactPerson
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
                        Contact No
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="ContactNumber"
                        size="small"
                        error={
                          touched.ContactNumber && Boolean(errors.ContactNumber)
                        }
                        helperText={
                          touched.ContactNumber && errors.ContactNumber
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
                        Landing Page
                      </Typography>
                      <Field
                        as={TextField}
                        select
                        fullWidth
                        name="LandingPage"
                        size="small"
                      >
                        <MenuItem value="1">Default</MenuItem>
                        <MenuItem value="2">Quick Access</MenuItem>
                      </Field>
                    </Grid>
                    <Grid item xs={12} mb={3} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Description
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Description"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} my={1}>
                      <Typography>Logo Upload</Typography>
                      <Button
                        component="label"
                        role={undefined}
                        variant="contained"
                        fullWidth
                        tabIndex={-1}
                        startIcon={<CloudUploadIcon />}
                      >
                        Upload files
                        <VisuallyHiddenInput
                          type="file"
                          onChange={(event) => {
                            var file = event.target.files[0]
                            setLogo(file);
                            setImage(URL.createObjectURL(file));
                          }}
                          multiple
                        />
                      </Button>
                    </Grid>

                    <Grid item xs={12} my={1}>
                      {image != "" ?
                        <Box sx={{ width: "100%", height: 200, backgroundSize: 'cover', backgroundImage: `url(${image})` }}></Box>
                        : ""}
                    </Grid>
                  </Grid>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Button
                        variant="contained"
                        color="error"
                        onClick={handleClose}
                        size="small"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        size="small"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                      >
                        {loading ? "Saving..." : "Save"}
                      </Button>
                    </Box>
                  </>
                )}

                {tabIndex === 1 && (
                  <Box sx={{ height: "60vh", overflowY: "scroll" }} my={2}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Upload Letterhead Image (A4 size: 210mm x 297mm / 2480 x 3508 px at 300 DPI)
                        </Typography>
                        <Button
                          component="label"
                          role={undefined}
                          variant="contained"
                          fullWidth
                          tabIndex={-1}
                          startIcon={<CloudUploadIcon />}
                        >
                          Upload Letterhead
                          <VisuallyHiddenInput
                            type="file"
                            accept="image/*"
                            onChange={handleLetterheadChange}
                          />
                        </Button>
                      </Grid>
                      <Grid item xs={12}>
                        {letterheadImage && (
                          <Box 
                            sx={{
                              width: "100%",
                              height: 400,
                              backgroundSize: 'contain',
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'center',
                              backgroundImage: `url(${letterheadImage})`,
                              border: '1px solid #ddd',
                              borderRadius: 1
                            }}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {tabIndex === 1 && (
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleClose}
                      size="small"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      size="small"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={16} /> : null}
                    >
                      {loading ? "Saving..." : "Save"}
                    </Button>
                  </Box>
                )}
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}

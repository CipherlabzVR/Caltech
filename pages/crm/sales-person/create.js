import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  MenuItem,
  Select,
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
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

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
  Code: Yup.string().required("Code is required"),
  Name: Yup.string().required("Name is required"),
  MobileNumber: Yup.string().required("Mobile Number is required"),
  Email: Yup.string().email("Invalid email format").required("Email is required"),
  SalesTarget: Yup.string().required("Sales Target is required"),
  Range: Yup.string().required("Time Period is required"),
});

export default function AddSalesPerson({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSignatureImage(null);
    setSignaturePreview(null);
  };

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [signatureImage, setSignatureImage] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setSignatureImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    setSignatureImage(null);
    setSignaturePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    
    Object.keys(values).forEach((key) => {
      if (values[key] !== null && values[key] !== undefined) {
        formData.append(key, values[key]);
      }
    });
    
    if (signatureImage) {
      formData.append("SignatureImage", signatureImage);
    } else {
      formData.append("SignatureImage", "");
    }

    fetch(`${BASE_URL}/SalesPerson/CreateSalesPerson`, {
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
          setSignatureImage(null);
          setSignaturePreview(null);
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
              Code: "",
              Name: "",
              MobileNumber: "",
              Email: "",
              SupplierId: null,
              Remark: "",
              SalesTarget: null,
              Range: null,
              SalesPersonType: 2
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
                        sx={{
                          fontWeight: "500",
                          mb: "12px",
                        }}
                      >
                        Add Sales Person
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ maxHeight: '70vh', overflowY: 'scroll' }} pb={3}>
                  <Grid spacing={1} container>
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
                        inputRef={inputRef}
                        name="Code"
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
                        Name
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Name"
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
                        Mobile Number
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="MobileNumber"
                        error={touched.MobileNumber && Boolean(errors.MobileNumber)}
                        helperText={touched.MobileNumber && errors.MobileNumber}
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
                        Email
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        type="email"
                        name="Email"
                        error={touched.Email && Boolean(errors.Email)}
                        helperText={touched.Email && errors.Email}
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
                        Target Time Period
                      </Typography>
                      <Select fullWidth value={values.Range} onChange={(e) => setFieldValue("Range", e.target.value)}>
                        <MenuItem value={6}>Daily</MenuItem>
                        <MenuItem value={9}>Weekly</MenuItem>
                        <MenuItem value={7}>Monthly</MenuItem>
                        <MenuItem value={8}>Yearly</MenuItem>
                      </Select>
                      {touched.Range && Boolean(errors.Range) && (
                        <Typography variant="caption" color="error">
                          {errors.Range}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Sales Target
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="SalesTarget"
                        error={touched.SalesTarget && Boolean(errors.SalesTarget)}
                        helperText={touched.SalesTarget && errors.SalesTarget}
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
                        Remark
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Remark"
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
                        Signature Image
                      </Typography>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Button
                          variant="outlined"
                          onClick={() => fileInputRef.current?.click()}
                          sx={{ width: "fit-content" }}
                        >
                          {signatureImage ? "Change Signature" : "Upload Signature"}
                        </Button>
                        {signaturePreview && (
                          <Box
                            sx={{
                              border: "1px solid #e0e0e0",
                              borderRadius: 1,
                              padding: 1,
                              backgroundColor: "#fafafa",
                              position: "relative",
                              display: "inline-block",
                            }}
                          >
                            <img
                              src={signaturePreview}
                              alt="Signature preview"
                              style={{
                                maxWidth: "200px",
                                maxHeight: "100px",
                                objectFit: "contain",
                                display: "block",
                              }}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              onClick={handleRemoveSignature}
                              aria-label="remove signature"
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                "&:hover": {
                                  backgroundColor: "rgba(255, 255, 255, 1)",
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                <Box display="flex" mt={2} justifyContent="space-between">
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained">
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

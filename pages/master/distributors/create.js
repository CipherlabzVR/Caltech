import React, { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  Typography,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import BASE_URL from "Base/api";

/** Matches ApexflowERP.Domain.Enums.DocumentType.Distributor */
const DOCUMENT_TYPE_DISTRIBUTOR = 61;

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 400, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const labelSx = {
  fontWeight: "500",
  fontSize: "14px",
  mb: "5px",
};

const footerButtonSx = {
  mt: 2,
  textTransform: "uppercase",
  borderRadius: "8px",
  fontWeight: "600",
  fontSize: "13px",
  padding: "12px 20px",
};

/** Sri Lankan local mobile: exactly 10 digits (e.g. 0771234567) */
const SL_MOBILE_10 = /^\d{10}$/;

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Distributor Name is required"),
  MobileNo: Yup.string()
    .trim()
    .required("Mobile number is required")
    .matches(
      SL_MOBILE_10,
      "Mobile number must be 10 digits (Sri Lankan format, e.g. 0771234567)"
    ),
});

export default function AddDistributorDialog({
  fetchItems,
  externalOpen,
  onClose: externalOnClose,
  showButton = true,
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [formKey, setFormKey] = useState(0);
  const [previewCode, setPreviewCode] = useState("");
  const [codePreviewLoading, setCodePreviewLoading] = useState(false);
  const inputRef = useRef(null);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;

  const handleOpen = () => {
    if (externalOpen === undefined) {
      setInternalOpen(true);
    }
  };

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else if (externalOpen === undefined) {
      setInternalOpen(false);
    }
    setFormKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (!open) {
      setPreviewCode("");
      setCodePreviewLoading(false);
      return;
    }

    let cancelled = false;
    setCodePreviewLoading(true);

    (async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=${DOCUMENT_TYPE_DISTRIBUTOR}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch next code");
        }

        const result = await response.json();
        if (!cancelled) {
          setPreviewCode(result.result ?? "");
        }
      } catch {
        if (!cancelled) {
          setPreviewCode("");
          toast.error(
            "Could not load distributor code. Check document sequence setup."
          );
        }
      } finally {
        if (!cancelled) {
          setCodePreviewLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");
    const { Name, MobileNo, IsActive } = values;
    fetch(`${BASE_URL}/Distributor/CreateDistributor`, {
      method: "POST",
      body: JSON.stringify({
        Name,
        MobileNo: String(MobileNo).trim(),
        IsActive,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          handleClose();
          if (fetchItems) {
            fetchItems();
          }
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(
          error.message || "Distributor Creation failed. Please try again."
        );
      });
  };

  return (
    <>
      {showButton && (
        <Button variant="outlined" onClick={handleOpen}>
          + ADD NEW
        </Button>
      )}

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="distributor-create-title"
        aria-describedby="distributor-create-description"
      >
        <Box sx={modalStyle} className="bg-black">
          <Formik
            key={formKey}
            initialValues={{
              Code: previewCode || "",
              Name: "",
              MobileNo: "",
              IsActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Box mt={2}>
                  <Grid spacing={1} container>
                    <Grid item xs={12}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: "500",
                          mb: "12px",
                        }}
                        id="distributor-create-title"
                      >
                        Add Distributor
                      </Typography>
                    </Grid>

                    <Grid item xs={12} mt={1}>
                      <Typography sx={labelSx}>Code</Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Code"
                        size="small"
                        placeholder={
                          codePreviewLoading
                            ? "Loading code…"
                            : "Assigned on save"
                        }
                        InputProps={{ readOnly: true }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            bgcolor: "action.hover",
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} mt={1}>
                      <Typography sx={labelSx}>Distributor Name</Typography>
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
                      <Typography sx={labelSx}>Mobile No</Typography>
                      <Field name="MobileNo">
                        {({ field, form, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            inputProps={{
                              maxLength: 10,
                              inputMode: "numeric",
                              autoComplete: "tel",
                            }}
                            onChange={(e) => {
                              const digits = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10);
                              form.setFieldValue("MobileNo", digits);
                            }}
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12} mt={1}>
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
                <Box display="flex" justifyContent="space-between">
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleClose}
                    sx={footerButtonSx}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      ...footerButtonSx,
                      color: "#fff !important",
                    }}
                  >
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

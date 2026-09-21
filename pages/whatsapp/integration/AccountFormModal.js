import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Grid,
  Modal,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createAccount, updateAccount } from "@/Services/whatsRay";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const labelStyle = { fontWeight: "500", fontSize: "14px", mb: "5px" };

const buildValidationSchema = (isEdit) =>
  Yup.object().shape({
    name: Yup.string().trim().required("Connection name is required"),
    clientId: Yup.string().trim().required("Client ID is required"),
    clientSecret: isEdit
      ? Yup.string()
      : Yup.string().trim().required("Client secret is required"),
    phoneNumber: Yup.string()
      .trim()
      .required("Connected WhatsApp number is required")
      .matches(
        /^\+?[0-9\s-]{9,20}$/,
        "Use international format, e.g. +94 74 121 8373"
      ),
    remoteAccountId: Yup.number()
      .transform((value, original) => (original === "" ? undefined : value))
      .typeError("WhatsRay account ID must be a number")
      .integer("WhatsRay account ID must be a whole number")
      .positive("WhatsRay account ID must be greater than zero"),
  });

/**
 * Add or edit a WhatsRay connection. In edit mode the secret field starts empty and
 * is only sent when the user types a replacement, because the API returns it masked.
 */
export default function AccountFormModal({
  account,
  prefill,
  fetchItems,
  open: controlledOpen,
  onClose,
  trigger,
}) {
  const isEdit = Boolean(account?.id);
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const inputRef = useRef(null);

  const handleOpen = () => setInternalOpen(true);
  const handleClose = () => {
    if (!isControlled) setInternalOpen(false);
    onClose?.();
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const initialValues = {
    name: account?.name ?? prefill?.name ?? "",
    clientId: account?.clientId ?? prefill?.clientId ?? "",
    clientSecret: "",
    phoneNumber: account?.phoneNumber ?? prefill?.phoneNumber ?? "",
    baseUrl: account?.baseUrl ?? prefill?.baseUrl ?? "",
    remoteAccountId: account?.remoteAccountId ?? prefill?.remoteAccountId ?? "",
    phoneNumberId: account?.phoneNumberId ?? prefill?.phoneNumberId ?? "",
    businessName: account?.businessName ?? prefill?.businessName ?? "",
    isDefault: account?.isDefault ?? false,
    isActive: account?.isActive ?? true,
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        clientId: values.clientId.trim(),
        clientSecret: values.clientSecret.trim(),
        phoneNumber: values.phoneNumber.trim(),
        baseUrl: values.baseUrl.trim() || null,
        remoteAccountId: values.remoteAccountId === "" ? null : Number(values.remoteAccountId),
        phoneNumberId: values.phoneNumberId.trim() || null,
        businessName: values.businessName.trim() || null,
        isDefault: values.isDefault,
        isActive: values.isActive,
      };

      const data = isEdit
        ? await updateAccount({ ...payload, id: account.id })
        : await createAccount(payload);

      if (data.statusCode === 200) {
        toast.success(data.message);
        handleClose();
        fetchItems?.();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to save the WhatsApp connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {!isControlled &&
        (trigger ? (
          React.cloneElement(trigger, { onClick: handleOpen })
        ) : (
          <Button variant="outlined" onClick={handleOpen}>
            + add whatsapp account
          </Button>
        ))}

      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={buildValidationSchema(isEdit)}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
                  {isEdit ? "Edit WhatsApp Account" : "Add WhatsApp Account"}
                </Typography>

                <Box sx={{ maxHeight: "62vh", overflowY: "auto" }} my={2}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Copy the Client ID and Client Secret from WhatsRay Dashboard → Developer
                    Tools, and make sure this server&apos;s public IP is on the WhatsRay IP
                    white list. Credentials are stored on the server and never sent back to
                    the browser.
                  </Alert>

                  <Grid spacing={1} container>
                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography sx={labelStyle}>Connection Name</Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        inputRef={inputRef}
                        name="name"
                        size="small"
                        placeholder="Beyond Destiny - Main"
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                      />
                    </Grid>

                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography sx={labelStyle}>Connected WhatsApp Number</Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="phoneNumber"
                        size="small"
                        placeholder="+94 74 121 8373"
                        error={touched.phoneNumber && Boolean(errors.phoneNumber)}
                        helperText={touched.phoneNumber && errors.phoneNumber}
                      />
                    </Grid>

                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography sx={labelStyle}>Client ID</Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="clientId"
                        size="small"
                        placeholder="ci_XXXXXXXXXXXXXXXXXXXX"
                        error={touched.clientId && Boolean(errors.clientId)}
                        helperText={touched.clientId && errors.clientId}
                      />
                    </Grid>

                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography sx={labelStyle}>Client Secret</Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="clientSecret"
                        type="password"
                        size="small"
                        autoComplete="new-password"
                        placeholder={
                          isEdit
                            ? `Leave blank to keep ${account?.clientSecretMasked || "current secret"}`
                            : "cs_XXXXXXXXXXXXXXXXXXXX"
                        }
                        error={touched.clientSecret && Boolean(errors.clientSecret)}
                        helperText={touched.clientSecret && errors.clientSecret}
                      />
                    </Grid>

                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography sx={labelStyle}>WhatsRay Account ID (optional)</Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="remoteAccountId"
                        size="small"
                        placeholder="Filled automatically by Sync"
                        error={touched.remoteAccountId && Boolean(errors.remoteAccountId)}
                        helperText={
                          (touched.remoteAccountId && errors.remoteAccountId) ||
                          "Leave blank and use Sync after saving."
                        }
                      />
                    </Grid>

                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography sx={labelStyle}>Meta Phone Number ID (optional)</Typography>
                      <Field as={TextField} fullWidth name="phoneNumberId" size="small" />
                    </Grid>

                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography sx={labelStyle}>Business Name (optional)</Typography>
                      <Field as={TextField} fullWidth name="businessName" size="small" />
                    </Grid>

                    <Grid item lg={6} xs={12} mt={1}>
                      <Typography sx={labelStyle}>API Base URL (optional)</Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="baseUrl"
                        size="small"
                        placeholder="https://wpp.raybeamdigital.com/external-api"
                        helperText="Leave blank to use the server default."
                      />
                    </Grid>

                    <Grid item xs={12} mt={1}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={values.isDefault}
                            onChange={(event) => setFieldValue("isDefault", event.target.checked)}
                          />
                        }
                        label="Use as the default sending number"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={values.isActive}
                            onChange={(event) => setFieldValue("isActive", event.target.checked)}
                          />
                        }
                        label="Active"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Button variant="contained" color="error" onClick={handleClose} size="small">
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" size="small" disabled={submitting}>
                    {submitting ? "Saving..." : "Save"}
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

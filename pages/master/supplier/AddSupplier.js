import React, { useEffect, useRef, useState } from "react";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
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

/** Optional leading + then digits only (e.g. +94771234567). */
function sanitizeSupplierMobileInput(raw) {
  const s = String(raw ?? "");
  const digits = s.replace(/\D/g, "");
  return s.trim().startsWith("+") ? `+${digits}` : digits;
}

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Name is required"),
  MobileNo: Yup.string()
    .required("Mobile No is required")
    .matches(
      /^\+?\d+$/,
      "Use digits only; you may start with + for country code"
    ),
});

export default function AddSupplier({
  fetchItems,
  isPOSSystem,
  banks,
  isBankRequired,
  chartOfAccounts,
  onCreated,
  hideButton = false,
  open: controlledOpen,
  onClose: controlledOnClose,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : internalOpen;
  const [selectedBank, setSelectedBank] = useState();
  const handleOpen = () => {
    if (!isControlled) setInternalOpen(true);
  };
  const handleClose = () => {
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalOpen(false);
    }
    setSelectedBank(undefined);
  };

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


  const handleSubmit = (values) => {
    if (!selectedBank && isBankRequired) {
      toast.warning("Please Select Bank")
      return;
    }
    const token = localStorage.getItem("token");

    const payload = {
      ...values,
      MobileNo: sanitizeSupplierMobileInput(values.MobileNo),
      BankId: selectedBank?.id || null,
      BankName: selectedBank?.name || "",
      BankAccountUserName: selectedBank?.accountUsername || "",
      BankAccountNo: selectedBank?.accountNo || "",
    };

    fetch(`${BASE_URL}/Supplier/CreateSupplier`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const sc = data.statusCode ?? data.StatusCode;
        const msg = data.message ?? data.Message ?? "";
        if (sc === 200) {
          toast.success(msg);
          const result = data.result ?? data.Result;
          const newId = result?.id ?? result?.Id;
          onCreated?.(result);
          handleClose();
          fetchItems?.(newId);
        } else {
          toast.error(msg);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  return (
    <>
      {!hideButton && (
        <Button variant="outlined" onClick={handleOpen}>
          + new supplier
        </Button>
      )}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            key={String(open)}
            initialValues={{
              Name: "",
              MobileNo: "",
              PayableAccount: null,
              IsActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
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
                      >
                        Add Supplier
                      </Typography>
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Supplier Name
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
                        Mobile No
                      </Typography>
                      <Field name="MobileNo">
                        {({ field, meta }) => (
                          <TextField
                            fullWidth
                            name={field.name}
                            value={field.value}
                            onBlur={field.onBlur}
                            onChange={(e) =>
                              setFieldValue("MobileNo", sanitizeSupplierMobileInput(e.target.value))
                            }
                            size="small"
                            inputProps={{ inputMode: "tel", autoComplete: "tel" }}
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                          />
                        )}
                      </Field>
                    </Grid>
                    {isPOSSystem && (
                      <>
                        <Grid item xs={12} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Email
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name="Email"
                            size="small"
                          />
                        </Grid>

                      </>
                    )}

                    {isBankRequired && (
                      <>
                        <Grid item xs={12} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Bank
                          </Typography>
                          <Select
                            size="small"
                            fullWidth
                            onChange={(e) => {
                              const selected = banks.find((bank) => bank.id === e.target.value);
                              setSelectedBank(selected);
                            }}

                          >
                            {banks.length === 0 ? (
                              <MenuItem disabled>No Data Available</MenuItem>
                            ) : (
                              banks.map((bank, index) => (
                                <MenuItem key={index} value={bank.id}>
                                  {bank.name} - {bank.accountUsername} ({bank.accountNo})
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </Grid>

                      </>
                    )}

                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Payable Account
                      </Typography>
                      <FormControl fullWidth>
                        <Field
                          as={TextField}
                          select
                          fullWidth
                          name="PayableAccount"
                          size="small"
                          onChange={(e) => {
                            setFieldValue("PayableAccount", e.target.value);
                          }}
                        >
                          {chartOfAccounts.length === 0 ? (
                            <MenuItem disabled>
                              No Accounts Available
                            </MenuItem>
                          ) : (
                            chartOfAccounts.map((acc, index) => (
                              <MenuItem key={index} value={acc.id}>
                                {acc.code} - {acc.description}
                              </MenuItem>
                            ))
                          )}
                        </Field>
                      </FormControl>
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
                    type="button"
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

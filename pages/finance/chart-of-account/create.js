import React, { useEffect, useRef, useState } from "react";
import { Checkbox, FormControlLabel, Grid, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  Description: Yup.string().required("Description is required"),
  AccountType: Yup.number().required("Account Type is required"),
});

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export default function AddChartOfAccounts({ fetchItems, activeGroupType, subTypes = [] }) {
  const [open, setOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState("");
  const [selectedAccountType, setSelectedAccountType] = useState(null);
  const inputRef = useRef(null);
  const formikRef = useRef(null);

  const handleClose = () => setOpen(false);

  const fetchNextCode = async (accountType) => {
    if (!accountType) {
      setPreviewCode("");
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/ChartOfAccount/GetNextCodeForAccountType?accountType=${accountType}`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch next code");
      }

      const data = await response.json();
      if (data.statusCode === 200 && data.result?.code) {
        setPreviewCode(data.result.code);
        formikRef.current?.setFieldValue("Code", data.result.code);
      } else {
        setPreviewCode("");
        formikRef.current?.setFieldValue("Code", "");
        toast.error(data.message || "Unable to preview account code");
      }
    } catch (err) {
      setPreviewCode("");
      formikRef.current?.setFieldValue("Code", "");
      toast.error(err.message || "Unable to preview account code");
    }
  };

  const handleOpen = async () => {
    const defaultType = subTypes[0]?.accountType ?? null;
    setSelectedAccountType(defaultType);
    setOpen(true);
    if (defaultType) {
      await fetchNextCode(defaultType);
    } else {
      setPreviewCode("");
      toast.error(`No account types configured for ${activeGroupType}`);
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleAccountTypeChange = async (setFieldValue, value) => {
    const accountType = Number(value);
    setSelectedAccountType(accountType);
    setFieldValue("AccountType", accountType);
    await fetchNextCode(accountType);
  };

  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/ChartOfAccount/CreateChartOfAccount`, {
      method: "POST",
      body: JSON.stringify({
        ...values,
        AccountType: Number(values.AccountType),
      }),
      headers: authHeaders(),
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

  const defaultAccountType = subTypes[0]?.accountType ?? "";

  return (
    <>
      <Button variant="outlined" onClick={handleOpen} disabled={subTypes.length === 0}>
        + new account
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            innerRef={formikRef}
            enableReinitialize
            initialValues={{
              Description: "",
              Code: previewCode,
              IsBankInvolved: false,
              AccountType: selectedAccountType ?? defaultAccountType,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "500", mb: "5px" }}>
                      Add Chart Of Account
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                      Group: {activeGroupType}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography sx={{ fontWeight: "500", mb: "5px" }}>Code</Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Code"
                      size="small"
                      error={touched.Code && Boolean(errors.Code)}
                      helperText={touched.Code && errors.Code}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Description
                    </Typography>
                    <Field
                      as={TextField}
                      size="small"
                      fullWidth
                      inputRef={inputRef}
                      name="Description"
                      error={touched.Description && Boolean(errors.Description)}
                      helperText={touched.Description && errors.Description}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Account Type
                    </Typography>
                    <FormControl fullWidth>
                      <Field
                        as={TextField}
                        select
                        fullWidth
                        name="AccountType"
                        size="small"
                        value={values.AccountType}
                        onChange={(e) => handleAccountTypeChange(setFieldValue, e.target.value)}
                      >
                        {subTypes.map((sub) => (
                          <MenuItem key={sub.accountType} value={sub.accountType}>
                            {sub.accountTypeName}
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.AccountType && Boolean(errors.AccountType) && (
                        <Typography variant="caption" color="error">
                          {errors.AccountType}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} mt={1} p={1}>
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="IsBankInvolved"
                          checked={values.IsBankInvolved}
                          onChange={() =>
                            setFieldValue("IsBankInvolved", !values.IsBankInvolved)
                          }
                        />
                      }
                      label="Bank Involved"
                    />
                  </Grid>
                  <Grid display="flex" justifyContent="space-between" item xs={12} p={1}>
                    <Button variant="contained" size="small" color="error" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" size="small">
                      Save
                    </Button>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { Grid, InputAdornment, Typography } from "@mui/material";
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
  Description: Yup.string().required("Description is required"),
  Percentage: Yup.number().required("Percentage is required"),
  ChartOfAccount: Yup.number().required("Please Select Chart of Account"),
});

export default function AddTax({ fetchItems, chartOfAccounts }) {
  const [taxCode, setTaxCode] = useState(null);
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);
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

  const handleOpen = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=25`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const result = await response.json();
      setTaxCode(result.result);
    } catch (err) {
      //
    }
    setOpen(true);
  };

  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/Tax/CreateTax`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
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
              Code: taxCode,
              Description: "",
              Percentage: null,
              ChartOfAccount: null,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, resetForm }) => (
              <Form>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Add Tax
                    </Typography>
                  </Grid>
                  <Box>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
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
                          size="small"
                          fullWidth
                          name="Code"
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12}>
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
                          size="small"
                          fullWidth
                          name="Description"
                          error={touched.Description && Boolean(errors.Description)}
                          helperText={touched.Description && errors.Description}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                            mb: "5px",
                          }}
                        >
                          Percentage
                        </Typography>
                        <Field
                          as={TextField}
                          size="small"
                          fullWidth
                          name="Percentage"
                          error={touched.Percentage && Boolean(errors.Percentage)}
                          helperText={touched.Percentage && errors.Percentage}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                            mb: "5px",
                          }}
                        >
                          Chart of Account
                        </Typography>
                        <FormControl fullWidth>
                          <Field
                            as={TextField}
                            select
                            fullWidth
                            name="ChartOfAccount"
                            size="small"
                            onChange={(e) => {
                              setFieldValue("ChartOfAccount", e.target.value);
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
                          {touched.ChartOfAccount &&
                            Boolean(errors.ChartOfAccount) && (
                              <Typography variant="caption" color="error">
                                {errors.ChartOfAccount}
                              </Typography>
                            )}
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                  <Grid container>
                    <Grid
                      display="flex"
                      justifyContent="space-between"
                      item
                      xs={12}
                      p={1}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        onClick={handleClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" size="small">
                        Save
                      </Button>
                    </Grid>
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

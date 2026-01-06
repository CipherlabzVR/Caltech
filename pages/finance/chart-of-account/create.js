import React, { useEffect, useRef } from "react";
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
  AccountType: Yup.string().required("Account Type is required"),
});

export default function AddChartOfAccounts({ fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState(false);
  const handleClose = () => setOpen(false);
  const inputRef = useRef(null);

  const handleOpen = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=23`,
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
        setCode(result.result);
      } catch (err) {
        //
      }
      setOpen(true);
    };

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
    fetch(`${BASE_URL}/ChartOfAccount/CreateChartOfAccount`, {
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
            initialValues={{
              Description: "",
              Code: code,
              IsBankInvolved: false,
              AccountType: 1
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
                      Add Chart Of Account
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      sx={{
                        fontWeight: "500",
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
                      disabled
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
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Account Type
                    </Typography>
                    <FormControl fullWidth>
                      <Field
                        as={TextField}
                        select
                        fullWidth
                        name="AccountType"
                        size="small"
                        onChange={(e) => {
                          setFieldValue("AccountType", e.target.value);
                        }}
                      >
                        <MenuItem value={1}> Income </MenuItem>
                        <MenuItem value={2}> Payment </MenuItem>
                        <MenuItem value={3}> Fixed Assets </MenuItem>
                        <MenuItem value={4}> Bank </MenuItem>
                        <MenuItem value={5}> Loan </MenuItem>
                        <MenuItem value={6}> Credit Card </MenuItem>
                        <MenuItem value={7}> Equity </MenuItem>
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
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { Checkbox, FormControlLabel, Grid, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
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
  width: { lg: 450, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Name is required"),
});

export default function AddTerminal({ fetchItems }) {
  const [code, setCode] = useState(null);
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
        `${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=18`,
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

  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/Terminal/CreateTerminal`, {
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
        + new terminal
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
              Name: "",
              Code: code,
              IsActive: true,
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
                      Add Terminal
                    </Typography>
                  </Grid>
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
                          mb: "5px",
                        }}
                      >
                        Name
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Name"
                        size="small"
                        inputRef={inputRef}
                        error={touched.Name && Boolean(errors.Name)}
                        helperText={touched.Name && errors.Name}
                      />
                    </Grid>
                    <Grid item xs={12} mt={1} p={1}>
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

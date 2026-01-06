import React, { useEffect, useRef, useState } from "react";
import { Checkbox, FormControlLabel, Grid, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import BASE_URL from "Base/api";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Name is required"),
});


export default function AddColor({fetchItems}) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [selectedIsActive, setSelectedIsActive] = useState(true);

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
    const token = localStorage.getItem('token');
    fetch(`${BASE_URL}/ColorCode/CreateColorCode`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      
    })
      .then((response) => response.json())
      .then((data) => {
        if(data.statusCode == 200){
          toast.success(data.message);
          setOpen(false);
          fetchItems();
        }else{
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || '');
      });
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>+ new Color</Button>
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
              IsActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched , values, setFieldValue}) => (
              <Form>
                <Box mt={2}>
                  <Grid container>
                    <Grid item xs={12} mt={2}>
                      <Typography
                        as="h5"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "12px",
                        }}
                      >
                        Color Code
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        inputRef={inputRef}
                        name="Name"
                        error={touched.Name && Boolean(errors.Name)}
                        helperText={touched.Name && errors.Name}
                      />
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
                    sx={{
                      mt: 2,
                      textTransform: "capitalize",
                      borderRadius: "8px",
                      fontWeight: "500",
                      fontSize: "13px",
                      padding: "12px 20px",
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      mt: 2,
                      textTransform: "capitalize",
                      borderRadius: "8px",
                      fontWeight: "500",
                      fontSize: "13px",
                      padding: "12px 20px",
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

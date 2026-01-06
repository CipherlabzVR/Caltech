import React, { useEffect, useRef } from "react";
import { Checkbox, FormControlLabel, Grid, Radio, RadioGroup, Typography } from "@mui/material";
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

export default function AddCashFlowType({ fetchItems }) {
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
    setOpen(true);
  };

  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/CashFlowType/CreateCashFlowType`, {
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
        + add type
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{ Name: "", Description: "", IsActive: true, CashType: 1 }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue, values, handleSubmit,touched,errors }) => (
              <Form onSubmit={handleSubmit}>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="h5" fontWeight={500}>
                      Cash Flow Type Create
                    </Typography>
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography>Cash Type</Typography>
                    <RadioGroup
                      name="CashType"
                      value={values.CashType}
                      onChange={(event) =>
                        setFieldValue("CashType", parseInt(event.target.value))
                      }
                      row
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                      }}
                    >
                      <FormControlLabel
                        value={1}
                        control={<Radio />}
                        label="Cash In"
                      />
                      <FormControlLabel
                        value={2}
                        control={<Radio />}
                        label="Cash Out"
                      />
                      <FormControlLabel
                        value={3}
                        control={<Radio />}
                        label="Bank"
                      />
                    </RadioGroup>
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography>Name</Typography>
                    <TextField
                      inputRef={inputRef}
                      type="text"
                      size="small"
                      required
                      name="Name"
                      fullWidth
                      onChange={(e) => setFieldValue("Name", e.target.value)}
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography>Description</Typography>
                    <TextField
                      type="text"
                      size="small"
                      required
                      name="Description"
                      onChange={(e) => setFieldValue("Description", e.target.value)}
                      fullWidth
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
                  <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
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

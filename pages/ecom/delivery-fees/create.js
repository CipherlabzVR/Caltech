import React, { useEffect, useRef, useState } from "react";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  RadioGroup,
  Radio,
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
import { SRI_LANKA_DISTRICTS } from "../../../constants/sriLankaDistricts";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 500, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  Mode: Yup.string().oneOf(["fixed", "district"]).required(),
  District: Yup.string().when("Mode", {
    is: "district",
    then: (s) => s.required("District is required"),
    otherwise: (s) => s.notRequired(),
  }),
  Amount: Yup.number()
    .typeError("Amount must be a number")
    .min(0, "Amount cannot be negative")
    .required("Amount is required"),
});

export default function AddDeliveryFee({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [open]);

  const handleSubmit = (values, { resetForm }) => {
    const token = localStorage.getItem("token");
    const payload = {
      District: values.Mode === "district" ? values.District : null,
      Amount: Number(values.Amount),
      IsFallback: values.Mode === "fixed",
      IsActive: values.IsActive,
    };
    fetch(`${BASE_URL}/ECommerce/CreateDeliveryFee`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          resetForm();
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
              Mode: "district",
              District: "",
              Amount: "",
              IsActive: true,
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
                        sx={{ fontWeight: "500", mb: "12px" }}
                      >
                        Add Delivery Fee
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
                        Type
                      </Typography>
                      <RadioGroup
                        row
                        name="Mode"
                        value={values.Mode}
                        onChange={(e) => {
                          setFieldValue("Mode", e.target.value);
                          if (e.target.value === "fixed") {
                            setFieldValue("District", "");
                          }
                        }}
                      >
                        <FormControlLabel
                          value="district"
                          control={<Radio />}
                          label="Per District"
                        />
                        <FormControlLabel
                          value="fixed"
                          control={<Radio />}
                          label="Fixed (Fallback)"
                        />
                      </RadioGroup>
                    </Grid>

                    {values.Mode === "district" && (
                      <Grid item xs={12} mt={1}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                            mb: "5px",
                          }}
                        >
                          District
                        </Typography>
                        <FormControl
                          fullWidth
                          size="small"
                          error={touched.District && Boolean(errors.District)}
                        >
                          <InputLabel>Select district</InputLabel>
                          <Select
                            label="Select district"
                            value={values.District}
                            onChange={(e) =>
                              setFieldValue("District", e.target.value)
                            }
                          >
                            {SRI_LANKA_DISTRICTS.map((d) => (
                              <MenuItem key={d} value={d}>
                                {d}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Amount (LKR)
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        inputRef={inputRef}
                        name="Amount"
                        type="number"
                        size="small"
                        inputProps={{ min: 0, step: "0.01" }}
                        error={touched.Amount && Boolean(errors.Amount)}
                        helperText={touched.Amount && errors.Amount}
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
                <Box display="flex" mt={2} justifyContent="space-between">
                  <Button
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

import React, { useEffect, useRef } from "react";
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
import { convertTo12Hour } from "@/components/utils/formatHelper";


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
  StartTime: Yup.string().required("Start time is required"),
  EndTime: Yup.string().required("End time is required"),
});

export default function AddTimeSlot({ fetchItems }) {
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

  const handleSubmit = async (values) => {
    const payload = {
      ...values,
      StartTime: convertTo12Hour(values.StartTime),
      EndTime: convertTo12Hour(values.EndTime),
    };

    fetch(`${BASE_URL}/TimeSlot/CreateTimeSlot`, {
      method: "POST",
      body: JSON.stringify(payload),
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
              StartTime: "",
              EndTime: "",
              IsActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, resetForm }) => (
              <Form>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Create Time Slot
                    </Typography>
                  </Grid>
                  <Grid item lg={6} xs={12}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Start Time
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      type="time"
                      name="StartTime"
                      inputRef={inputRef}
                      error={touched.StartTime && Boolean(errors.StartTime)}
                      helperText={touched.StartTime && errors.StartTime}
                    />
                  </Grid>
                  <Grid item lg={6} xs={12}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      End Time
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      type="time"
                      name="EndTime"
                      error={touched.EndTime && Boolean(errors.EndTime)}
                      helperText={touched.EndTime && errors.EndTime}
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
                  <Grid
                    display="flex"
                    justifyContent="space-between"
                    item
                    xs={12}
                    p={1}
                  >
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
      </Modal >
    </>
  );
}

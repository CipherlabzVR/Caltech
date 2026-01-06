import React, { useEffect, useRef, useState } from "react";
import { Grid, MenuItem, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";

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
  FiscalYear: Yup.string().required("Year is required"),
  FiscalMonth: Yup.string().required("Month is required"),
  StartDate: Yup.string().required("Start Date is required"),
  DisplayTitle: Yup.string().required("Title is required"),
  WarehouseId: Yup.string().required("Warehouse is required"),
  CompanyId: Yup.string().required("Company is required"),
});

export default function AddFiscalPeriod({ fetchItems, warehouses, companies }) {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleOpen = async () => {
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const inputRef = useRef(null);
  const months = [
    { number: 1, name: "January" },
    { number: 2, name: "February" },
    { number: 3, name: "March" },
    { number: 4, name: "April" },
    { number: 5, name: "May" },
    { number: 6, name: "June" },
    { number: 7, name: "July" },
    { number: 8, name: "August" },
    { number: 9, name: "September" },
    { number: 10, name: "October" },
    { number: 11, name: "November" },
    { number: 12, name: "December" },
  ];

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
    setIsLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/Fiscal/CreateFiscalPeriod`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + new fiscal period
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
              FiscalYear: year || "",
              FiscalMonth: month || "",
              StartDate: formatDate(currentDate) || "",
              EndDate: null,
              DisplayTitle: "",
              WarehouseId: "",
              CompanyId: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "500",
                      mb: "12px",
                    }}
                  >
                    Add Fiscal Period
                  </Typography>
                </Box>
                <Box sx={{ height: "60vh", overflowY: "scroll" }} my={2}>
                  <Grid spacing={1} container>
                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Fiscal Year
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        inputRef={inputRef}
                        name="FiscalYear"
                        size="small"
                        type="number"
                        error={touched.FiscalYear && Boolean(errors.FiscalYear)}
                        helperText={touched.FiscalYear && errors.FiscalYear}
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
                        Fiscal Month
                      </Typography>
                      <Field
                        as={TextField}
                        select
                        fullWidth
                        name="FiscalMonth"
                        size="small"
                      >
                        <MenuItem value="" disabled>
                          Select Month
                        </MenuItem>
                        {months.map((month, index) => (
                          <MenuItem key={index} value={month.number}>
                            {month.name}
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.FiscalMonth && Boolean(errors.FiscalMonth) && (
                        <Typography variant="caption" color="error">
                          {errors.FiscalMonth}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Start Date
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="StartDate"
                        size="small"
                        type="date"
                        error={touched.StartDate && Boolean(errors.StartDate)}
                        helperText={touched.StartDate && errors.StartDate}
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
                        Display Title
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="DisplayTitle"
                        size="small"
                        error={
                          touched.DisplayTitle && Boolean(errors.DisplayTitle)
                        }
                        helperText={touched.DisplayTitle && errors.DisplayTitle}
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
                        Company
                      </Typography>
                      <Field
                        as={TextField}
                        select
                        fullWidth
                        name="CompanyId"
                        size="small"
                      >
                        <MenuItem value="" disabled>
                          Select Company
                        </MenuItem>
                        {companies.length === 0 ? (
                          <MenuItem value="">No Companies Available</MenuItem>
                        ) : (
                          companies.map((item, index) => (
                            <MenuItem key={index} value={item.id}>
                              {item.code} - {item.name}
                            </MenuItem>
                          ))
                        )}
                      </Field>
                      {touched.CompanyId && Boolean(errors.CompanyId) && (
                        <Typography variant="caption" color="error">
                          {errors.CompanyId}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item mb={3} xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Warehouse
                      </Typography>
                      <Field
                        as={TextField}
                        select
                        fullWidth
                        name="WarehouseId"
                        size="small"
                      >
                        <MenuItem value="" disabled>
                          Select Warehouse
                        </MenuItem>
                        {warehouses.length === 0 ? (
                          <MenuItem value="">No Warehouses Available</MenuItem>
                        ) : (
                          warehouses.map((item, index) => (
                            <MenuItem key={index} value={item.id}>
                              {item.code} - {item.name}
                            </MenuItem>
                          ))
                        )}
                      </Field>
                      {touched.WarehouseId && Boolean(errors.WarehouseId) && (
                        <Typography variant="caption" color="error">
                          {errors.WarehouseId}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleClose}
                    size="small"
                  >
                    Cancel
                  </Button>
                  <Button disabled={isLoading} type="submit" variant="contained" size="small">
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

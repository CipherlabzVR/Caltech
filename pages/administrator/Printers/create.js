import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const validationSchema = Yup.object().shape({
  PrinterName: Yup.string().required("Printer Name is required"),
  IPAddress: Yup.string().required("IP Address is required"),
  TiketsType: Yup.number().required("Ticket Type is required"),
  WarehouseId: Yup.number().required("Warehouse is required"),
});

export default function AddPrinterDialog({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const [scroll, setScroll] = useState("paper");
  const [warehouseList, setWarehouseList] = useState([]);
  const [tiketsTypes, setTiketsTypes] = useState([]);

  const token = localStorage.getItem("token");

  const handleClickOpen = (scrollType) => () => {
    setOpen(true);
    setScroll(scrollType);
    fetchDropdowns();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const fetchDropdowns = async () => {
    try {
      const authHeader = { Authorization: `Bearer ${token}` };

      const [warehouseRes, tiketTypesRes] = await Promise.all([
        fetch(`${BASE_URL}/Warehouse/GetAllWarehouse`, { headers: authHeader }),
        fetch(`${BASE_URL}/Printer/TiketsTypes`, { headers: authHeader }),
      ]);

      const warehouseData = await warehouseRes.json();
      const tiketTypesData = await tiketTypesRes.json();

      setWarehouseList(warehouseData.result || []);
      setTiketsTypes(tiketTypesData || []);
    } catch (err) {
      toast.error("Failed to load dropdown data");
    }
  };

  const handleSubmit = (values, { resetForm }) => {
    const payload = {
      PrinterName: values.PrinterName.trim(),
      IPAddress: values.IPAddress.trim(),
      TicketType: values.TiketsType,
      WarehouseId: values.WarehouseId ? parseInt(values.WarehouseId) : null,
      IsActive: values.IsActive,
    };

    fetch(`${BASE_URL}/Printer/CreatePrinterAsync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          toast.success("Printer created successfully");
          fetchItems?.();
          resetForm();
          handleClose();
        } else {
          toast.error(data.message || "Creation failed");
        }
      })
      .catch((err) => {
        toast.error("Error: " + err.message);
      });
  };

  return (
    <>
      <Button variant="outlined" onClick={handleClickOpen("paper")}>
        <AddIcon /> Create New Printer
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        scroll={scroll}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 10,
            px: 3,
            pt: 2,
            pb: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "20px" }}>
          Add Terminal
        </DialogTitle>

        <DialogContent>
          <Formik
            initialValues={{
              PrinterName: "",
              IPAddress: "",
              TiketsType: null,
              WarehouseId: null,
              IsActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, setFieldValue }) => (
              <Form>
                <Grid container spacing={2}>
                  {/* Code */}
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      label="Code"
                      name="IPAddress"
                      fullWidth
                      size="small"
                      variant="outlined"
                      error={touched.IPAddress && Boolean(errors.IPAddress)}
                      helperText={touched.IPAddress && errors.IPAddress}
                    />
                  </Grid>

                  {/* Name */}
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      label="Name"
                      name="PrinterName"
                      fullWidth
                      size="small"
                      variant="outlined"
                      error={touched.PrinterName && Boolean(errors.PrinterName)}
                      helperText={touched.PrinterName && errors.PrinterName}
                    />
                  </Grid>

                  {/* Ticket Type */}
                  <Grid item xs={12}>
                    <FormControl
                      fullWidth
                      size="small"
                      error={touched.TiketsType && Boolean(errors.TiketsType)}
                    >
                      <InputLabel>Ticket Type</InputLabel>
                      <Select
                        name="TiketsType"
                        value={values.TiketsType}
                        label="Ticket Type"
                        onChange={(e) =>
                          setFieldValue("TiketsType", Number(e.target.value))
                        }
                      >
                        {tiketsTypes.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.tiketsname}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.TiketsType && errors.TiketsType && (
                        <Typography color="error" variant="caption">
                          {errors.TiketsType}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Warehouse */}
                  <Grid item xs={12}>
                    <FormControl
                      fullWidth
                      size="small"
                      error={touched.WarehouseId && Boolean(errors.WarehouseId)}
                    >
                      <InputLabel>Warehouse</InputLabel>
                      <Select
                        name="WarehouseId"
                        value={values.WarehouseId}
                        label="Warehouse"
                        onChange={(e) =>
                          setFieldValue("WarehouseId", Number(e.target.value))
                        }
                      >
                        {warehouseList.map((wh) => (
                          <MenuItem key={wh.id} value={wh.id}>
                            {wh.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.WarehouseId && errors.WarehouseId && (
                        <Typography color="error" variant="caption">
                          {errors.WarehouseId}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Active Checkbox */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.IsActive}
                          onChange={(e) =>
                            setFieldValue("IsActive", e.target.checked)
                          }
                          size="small"
                          sx={{ color: "#3f51b5" }}
                        />
                      }
                      label={<Typography sx={{ fontSize: "14px" }}>Active</Typography>}
                    />
                  </Grid>

                  {/* Buttons */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 2,
                        mt: 1,
                      }}
                    >
                      <Button
                        onClick={handleClose}
                        variant="contained"
                        sx={{
                          backgroundColor: "#f44336",
                          color: "#fff",
                          "&:hover": { backgroundColor: "#d32f2f" },
                          textTransform: "uppercase",
                          px: 3,
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        sx={{
                          backgroundColor: "#6366f1",
                          color: "#fff",
                          "&:hover": { backgroundColor: "#4f46e5" },
                          textTransform: "uppercase",
                          px: 3,
                        }}
                      >
                        Save
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
    </>
  );
}

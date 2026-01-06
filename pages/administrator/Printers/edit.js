import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Checkbox,
  FormControlLabel,
  Box
} from "@mui/material";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

// ✅ Validation Schema
const validationSchema = Yup.object().shape({
  PrinterName: Yup.string().required("Printer name is required"),
  IPAddress: Yup.string().required("IP Address is required"),
  TiketsType: Yup.number().required("Ticket type is required"),
  WarehouseId: Yup.number().required("Warehouse is required"),
});

export default function EditPrinterDialog({ fetchItems, item }) {
  const [open, setOpen] = useState(false);
  const [scroll, setScroll] = useState("paper");
  const [warehouseList, setWarehouseList] = useState([]);
  const [TiketsTypeList, setTiketsTypeList] = useState([]);

  const token = localStorage.getItem("token");

  const handleClickOpen = (scrollType) => async () => {
    await fetchDropdowns();
    setScroll(scrollType);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // 🔁 Fetch dropdowns
  const fetchDropdowns = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [warehouseRes, tiketTypesRes] = await Promise.all([
        fetch(`${BASE_URL}/Warehouse/GetAllWarehouse`, { headers }),
        fetch(`${BASE_URL}/Printer/TiketsTypes`, { headers }),
      ]);

      const warehouseData = await warehouseRes.json();
      const tiketTypesData = await tiketTypesRes.json();

      setWarehouseList(warehouseData.result || []);
      setTiketsTypeList(tiketTypesData || []);
    } catch (err) {
      toast.error("Failed to load dropdown data");
      console.error(err);
    }
  };

  // 🧠 Map ticketTypeName to ticketType ID
  const matchedTicketType = TiketsTypeList.find(
    (t) => t.tiketsname === item.ticketTypeName
  );
  const matchedTicketTypeId = matchedTicketType?.id ?? "";


  // 🚀 Submit handler
  const handleSubmit = async (values) => {
    const payload = {
      id: item.id,
      PrinterName: values.PrinterName.trim(),
      IPAddress: values.IPAddress.trim(),
      TicketType: values.TiketsType,
      WarehouseId: values.WarehouseId,
      IsActive: values.IsActive,
    };

    try {
      const response = await fetch(`${BASE_URL}/Printer/UpdatePrinterAsync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (response.ok && (data.statusCode === 200 || Object.keys(data).length === 0)) {
        toast.success("Printer updated successfully");
        fetchItems();
        handleClose();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (err) {
      toast.error("Update failed");
      console.error("❌ Error:", err);
    }
  };

  return (
    <>
      <Tooltip title="Edit Printer">
        <IconButton onClick={handleClickOpen("paper")} size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        scroll={scroll}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "8px",
            boxShadow: 10,
            padding: "20px 24px",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "20px", mb: 1 }}>
          Edit Printer
        </DialogTitle>
  
        <DialogContent>
          <Formik
            enableReinitialize
            initialValues={{
              PrinterName: item?.printername || "",
              IPAddress: item?.iPaddress || "",
              TiketsType: matchedTicketTypeId || null,
            WarehouseId: warehouseList.find(w => w.name === item.warehouseName)?.id || null,

              IsActive: item?.isActive ?? true,
            }}

           
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
          
            {({ values, errors, touched, setFieldValue }) => (
              <Form>
                <Grid container spacing={2}>
                  {/* IP Address Field */}
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="IPAddress"
                      label="Code"
                      fullWidth
                      variant="outlined"
                      size="small"
                      error={touched.IPAddress && Boolean(errors.IPAddress)}
                      helperText={touched.IPAddress && errors.IPAddress}
                    />
                  </Grid>

                  {/* Printer Name Field */}
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="PrinterName"
                      label="Name"
                      fullWidth
                      variant="outlined"
                      size="small"
                      error={touched.PrinterName && Boolean(errors.PrinterName)}
                      helperText={touched.PrinterName && errors.PrinterName}
                    />
                  </Grid>

                  {/* Ticket Type Dropdown */}
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
                        {TiketsTypeList.map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.tiketsname}
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

                  {/* Warehouse Dropdown */}
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
                        {warehouseList.map((w) => (
                          <MenuItem key={w.id} value={w.id}>
                            {w.name}
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
                      label={
                        <Typography sx={{ fontSize: "14px" }}>Active</Typography>
                      }
                    />
                  </Grid>

                  {/* Buttons */}
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
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

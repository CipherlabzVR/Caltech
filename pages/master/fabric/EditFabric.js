import React, { useEffect, useState } from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  ListItemText,
  OutlinedInput,
  Tooltip,
  Typography,
} from "@mui/material";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import BASE_URL from "Base/api";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Fabric Name is required"),
  IsActive: Yup.bool().required("Please Select Status"),
  InquiryCategoryFabrics: Yup.array()
    .of(
      Yup.object().shape({
        InquiryCategoryId: Yup.number(),
        InquiryCategoryName: Yup.string(),
        FabricId: Yup.number(),
        IsActive: Yup.bool(),
      })
    )
    .min(1, "At least one category must be selected"),
  Suppliers: Yup.array()
    .of(
      Yup.object().shape({
        SupplierId: Yup.number(),
        SupplierName: Yup.string(),
        FabricId: Yup.number(),
        IsActive: Yup.bool(),
      })
    )
    .min(1, "At least one supplier must be selected"),
});

export default function EditFabric({ fetchItems, item, suppliers }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [inquiryCategory, setInquiryCategory] = useState([]);

  const fetchInquiryCategory = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryCategory/GetAllInquiryCategory`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Inquiry Category");
      }

      const data = await response.json();
      setInquiryCategory(data.result);
    } catch (error) {
      console.error("Error fetching Inquiry Category:", error);
    }
  };

  useEffect(() => {
    fetchInquiryCategory();
  }, []);

  const handleSubmit = async (values) => {
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/Fabric/UpdateFabric`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode === 200) {
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
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              Id: item.id,
              Name: item.name || "",
              IsActive: item.isActive ?? true,
              InquiryCategoryFabrics: item.inquiryCategoryFabrics.map(
                (category) => ({
                  InquiryCategoryId: category.inquiryCategoryId,
                  InquiryCategoryName: category.inquiryCategoryName,
                  FabricId: category.fabricId,
                  IsActive: category.isActive,
                })
              ),
              Suppliers: item.suppliers.map(
                (supplier) => ({
                  SupplierId: supplier.supplierId,
                  SupplierName: supplier.supplierName,
                  FabricId: supplier.fabricId,
                  IsActive: supplier.isActive,
                })
              ),
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Box>
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
                        Fabric Name
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Name"
                        error={touched.Name && Boolean(errors.Name)}
                        helperText={touched.Name && errors.Name}
                      />
                    </Grid>
                    <Grid item xs={12} mt={2}>
                      <FormControl fullWidth>
                        <InputLabel id="demo-multiple-checkbox-label">
                          Inquiry Categories
                        </InputLabel>
                        <Select
                          labelId="demo-multiple-checkbox-label"
                          id="demo-multiple-checkbox"
                          multiple
                          value={values.InquiryCategoryFabrics.map(
                            (fabric) => fabric.InquiryCategoryId
                          )}
                          onChange={(event) => {
                            setFieldValue(
                              "InquiryCategoryFabrics",
                              event.target.value.map((categoryId) => ({
                                InquiryCategoryId: categoryId,
                                InquiryCategoryName: inquiryCategory.find(
                                  (inquiry) => inquiry.id === categoryId
                                )?.name,
                                IsActive: true,
                              }))
                            );
                          }}
                          input={<OutlinedInput label="Inquiry Categories" />}
                          MenuProps={MenuProps}
                          renderValue={(selected) =>
                            selected.length > 0
                              ? selected
                                .map(
                                  (id) =>
                                    inquiryCategory.find(
                                      (inquiry) => inquiry.id === id
                                    )?.name || ""
                                )
                                .join(", ")
                              : "Select Inquiry Categories"
                          }
                        >
                          {inquiryCategory.map((inquiry, index) => (
                            <MenuItem key={index} value={inquiry.id}>
                              <Checkbox
                                checked={values.InquiryCategoryFabrics.some(
                                  (fabric) =>
                                    fabric.InquiryCategoryId === inquiry.id
                                )}
                              />
                              <ListItemText primary={inquiry.name} />
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.InquiryCategoryFabrics &&
                          touched.InquiryCategoryFabrics && (
                            <Typography variant="body2" color="error">
                              {errors.InquiryCategoryFabrics}
                            </Typography>
                          )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} mt={2}>
                      <FormControl fullWidth>
                        <InputLabel id="demo-multiple-checkbox-label">
                          Suppliers
                        </InputLabel>
                        <Select
                          labelId="demo-multiple-checkbox-label"
                          id="demo-multiple-checkbox"
                          multiple
                          value={values.Suppliers.map(
                            (supplier) => supplier.SupplierId
                          )}
                          onChange={(event) => {
                            setFieldValue(
                              "Suppliers",
                              event.target.value.map((supplierId) => ({
                                SupplierId: supplierId,
                                SupplierName: suppliers.find(
                                  (supplier) => supplier.id === supplierId
                                )?.name,
                                IsActive: true,
                              }))
                            );
                          }}
                          input={<OutlinedInput label="Suppliers" />}
                          MenuProps={MenuProps}
                          renderValue={(selected) =>
                            selected.length > 0
                              ? selected
                                .map(
                                  (id) =>
                                    suppliers.find(
                                      (supplier) => supplier.id === id
                                    )?.name || ""
                                )
                                .join(", ")
                              : "Select Suppliers"
                          }
                        >
                          {suppliers.map((supplier, index) => (
                            <MenuItem key={index} value={supplier.id}>
                              <Checkbox
                                checked={values.Suppliers.some(
                                  (fabric) =>
                                    fabric.SupplierId === supplier.id
                                )}
                              />
                              <ListItemText primary={supplier.name} />
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.Suppliers &&
                          touched.Suppliers && (
                            <Typography variant="body2" color="error">
                              {errors.Suppliers}
                            </Typography>
                          )}
                      </FormControl>
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
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}

import React, { useEffect, useState } from "react";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Field, FieldArray, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 720, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  maxHeight: "90vh",
  overflowY: "auto",
};

const validationSchema = Yup.object().shape({
  CategoryId: Yup.number().min(1, "Category is required").required("Category is required"),
  Name: Yup.string().required("Name is required"),
  EventType: Yup.number().required("Event type is required"),
  BasePrice: Yup.number()
    .typeError("Base price must be a number")
    .min(0, "Cannot be negative")
    .required("Base price is required"),
  DisplayOrder: Yup.number()
    .typeError("Order must be a number")
    .min(0, "Cannot be negative")
    .required("Order is required"),
});

const emptyItem = () => ({ LineText: "", DisplayOrder: 1 });
const emptyVariant = () => ({ VariantName: "", Price: "", DisplayOrder: 1 });

export default function EditPackage({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const { data: eventTypesRaw } = useApi("/PhotographyEventType/GetActiveEventTypes");
  const eventTypes = Array.isArray(eventTypesRaw) ? eventTypesRaw : [];
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/PhotographyPackageCategory/GetActiveCategories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setCategories(data?.result || []))
      .catch(() => setCategories([]));
  }, [open]);

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");
    const payload = {
      Id: item.id,
      CategoryId: Number(values.CategoryId),
      Name: values.Name,
      Description: values.Description || null,
      EventType: Number(values.EventType),
      BasePrice: Number(values.BasePrice) || 0,
      IsRecommended: values.IsRecommended,
      DisplayOrder: Math.max(0, Number(values.DisplayOrder) || 0),
      IsActive: values.IsActive,
      Items: (values.Items || [])
        .filter((i) => (i.LineText || "").trim())
        .map((i, idx) => ({
          LineText: i.LineText.trim(),
          DisplayOrder: Math.max(0, Number(i.DisplayOrder) || idx + 1),
        })),
      Variants: (values.Variants || [])
        .filter((v) => (v.VariantName || "").trim())
        .map((v, idx) => ({
          VariantName: v.VariantName.trim(),
          Price: Number(v.Price) || 0,
          DisplayOrder: Math.max(0, Number(v.DisplayOrder) || idx + 1),
        })),
    };
    fetch(`${BASE_URL}/PhotographyPackage/UpdatePackage`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const sc = data.statusCode ?? data.StatusCode;
        const msg = data.message ?? data.Message ?? "";
        if (sc === 200 || sc === "SUCCESS") {
          toast.success(msg || "Package updated");
          handleClose();
          fetchItems?.();
        } else {
          toast.error(msg || "Failed to update package");
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  const initialItems =
    item.items?.length > 0
      ? item.items.map((i) => ({
          LineText: i.lineText || "",
          DisplayOrder: i.displayOrder ?? 1,
        }))
      : [emptyItem()];

  const initialVariants =
    item.variants?.length > 0
      ? item.variants.map((v) => ({
          VariantName: v.variantName || "",
          Price: v.price ?? "",
          DisplayOrder: v.displayOrder ?? 1,
        }))
      : [emptyVariant()];

  return (
    <>
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Formik
            enableReinitialize
            initialValues={{
              CategoryId: item.categoryId || "",
              Name: item.name || "",
              Description: item.description || "",
              EventType: item.eventType || 1,
              BasePrice: item.basePrice ?? "",
              IsRecommended: item.isRecommended ?? false,
              DisplayOrder: item.displayOrder ?? 1,
              IsActive: item.isActive ?? true,
              Items: initialItems,
              Variants: initialVariants,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Grid spacing={1} container>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
                      Edit Package
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Category
                    </Typography>
                    <FormControl fullWidth size="small" error={touched.CategoryId && Boolean(errors.CategoryId)}>
                      <Select
                        displayEmpty
                        value={values.CategoryId}
                        onChange={(e) => setFieldValue("CategoryId", e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Select category</em>
                        </MenuItem>
                        {categories.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {touched.CategoryId && errors.CategoryId ? (
                      <Typography color="error" variant="caption">
                        {errors.CategoryId}
                      </Typography>
                    ) : null}
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Event Type
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={values.EventType}
                        onChange={(e) => setFieldValue("EventType", e.target.value)}
                      >
                        {eventTypes.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={8} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Name
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Name"
                      size="small"
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>

                  <Grid item xs={12} md={4} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Base Price
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="BasePrice"
                      size="small"
                      error={touched.BasePrice && Boolean(errors.BasePrice)}
                      helperText={touched.BasePrice && errors.BasePrice}
                    />
                  </Grid>

                  <Grid item xs={12} md={8} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Description
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      multiline
                      minRows={2}
                      name="Description"
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} md={4} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Display Order
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      name="DisplayOrder"
                      size="small"
                      inputProps={{ min: 0 }}
                      error={touched.DisplayOrder && Boolean(errors.DisplayOrder)}
                      helperText={touched.DisplayOrder && errors.DisplayOrder}
                    />
                  </Grid>

                  <Grid item xs={12} mt={1}>
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="IsRecommended"
                          checked={values.IsRecommended}
                          onChange={() => setFieldValue("IsRecommended", !values.IsRecommended)}
                        />
                      }
                      label="Recommended"
                    />
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="IsActive"
                          checked={values.IsActive}
                          onChange={() => setFieldValue("IsActive", !values.IsActive)}
                        />
                      }
                      label="Active"
                    />
                  </Grid>

                  <Grid item xs={12} mt={2}>
                    <Typography sx={{ fontWeight: "600", fontSize: "15px", mb: 1 }}>
                      Package Items
                    </Typography>
                    <FieldArray name="Items">
                      {({ push, remove }) => (
                        <>
                          {values.Items.map((_, index) => (
                            <Grid container spacing={1} key={index} alignItems="center" mb={1}>
                              <Grid item xs={8}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  name={`Items.${index}.LineText`}
                                  placeholder="e.g. 8 Hours Coverage"
                                />
                              </Grid>
                              <Grid item xs={3}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  type="number"
                                  name={`Items.${index}.DisplayOrder`}
                                  placeholder="Order"
                                  inputProps={{ min: 0 }}
                                />
                              </Grid>
                              <Grid item xs={1}>
                                <IconButton
                                  size="small"
                                  onClick={() => remove(index)}
                                  disabled={values.Items.length === 1}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Grid>
                            </Grid>
                          ))}
                          <Button size="small" onClick={() => push(emptyItem())}>
                            + Add item
                          </Button>
                        </>
                      )}
                    </FieldArray>
                  </Grid>

                  <Grid item xs={12} mt={2}>
                    <Typography sx={{ fontWeight: "600", fontSize: "15px", mb: 1 }}>
                      Variants
                    </Typography>
                    <FieldArray name="Variants">
                      {({ push, remove }) => (
                        <>
                          {values.Variants.map((_, index) => (
                            <Grid container spacing={1} key={index} alignItems="center" mb={1}>
                              <Grid item xs={5}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  name={`Variants.${index}.VariantName`}
                                  placeholder="e.g. 2 Cameras"
                                />
                              </Grid>
                              <Grid item xs={3}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  name={`Variants.${index}.Price`}
                                  placeholder="Price"
                                />
                              </Grid>
                              <Grid item xs={3}>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  size="small"
                                  type="number"
                                  name={`Variants.${index}.DisplayOrder`}
                                  placeholder="Order"
                                  inputProps={{ min: 0 }}
                                />
                              </Grid>
                              <Grid item xs={1}>
                                <IconButton
                                  size="small"
                                  onClick={() => remove(index)}
                                  disabled={values.Variants.length === 1}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Grid>
                            </Grid>
                          ))}
                          <Button size="small" onClick={() => push(emptyVariant())}>
                            + Add variant
                          </Button>
                        </>
                      )}
                    </FieldArray>
                  </Grid>
                </Grid>

                <Box display="flex" mt={2} justifyContent="space-between">
                  <Button variant="contained" color="error" onClick={handleClose} size="small">
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" size="small">
                    Update
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

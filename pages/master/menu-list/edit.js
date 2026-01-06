import React, { useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import CloseIcon from '@mui/icons-material/Close';
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";
import DeleteIcon from "@mui/icons-material/Delete";
import BorderColorIcon from "@mui/icons-material/BorderColor";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Name is required"),
  CategoryId: Yup.string().required("Category is required"),
  SubCategoryId: Yup.string().required("Sub Category is required"),
  KitchenId: Yup.string().required("Kitchen is required"),
});

export default function EditMenuItem({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [portions, setPortions] = useState([]);
  const [priceList, setPriceList] = useState([]);
  const [image, setImage] = useState(null);
  const { data: categoryList } = useApi("/Category/GetAllCategory");
  const { data: kitchenList } = useApi("/Kitchen/GetAll");
  const { data: portionList } = useApi("/Portion/GetAll");

  const handleOpen = () => {
    handleGetSubCategories(item.categoryId);
    setOpen(true);
    setImage(item.productImage);
    setPriceList(item.pricing);
  };
  const handleClose = () => {
    setOpen(false);
    setImage(null);
    setFile(null);
  };

  useEffect(() => {
    if (categoryList) {
      setCategories(categoryList);
    }
    if (kitchenList) {
      setKitchens(kitchenList);
    }
    if (portionList) {
      setPortions(portionList);
    }
  }, [categoryList, kitchenList, portionList]);


  const handleSetPortionPrices = (item) => {
    var newItem = {
      portionName: item.name,
      portionId: item.id,
      sellingPrice: null,
      costPrice: 0,
      tax: 0
    };
    setPriceList((prev) => {
      if (prev.some((p) => p.portionId === newItem.portionId)) {
        toast.warning("This portion is already added!");
        return prev;
      }
      return [...prev, newItem];
    });
  }

  const handlePriceChange = (index, field, value) => {
    setPriceList((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    );
  };

  const handleDeletePortion = (index) => {
    setPriceList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGetSubCategories = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/SubCategory/GetAllSubCategoriesByCategoryId?categoryId=${id}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setSubCategories(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);

      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (values) => {

    if (!priceList.length) {
      toast.error("At least one price list item is required.");
      return;
    }

    const invalidItem = priceList.find(item => !item.sellingPrice || item.sellingPrice <= 0);
    if (invalidItem) {
      toast.error("All price list items must have a valid selling price.");
      return;
    }

    const data = {
      ...values,
      ProductImage: file ? file : null,
      PrevImage: image ? image : null,
      MenuPricing: priceList.map((row) => ({
        PortionId: row.portionId,
        SellingPrice: row.sellingPrice,
        CostPrice: row.costPrice,
        Tax: row.tax
      }))
    };

    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      const value = data[key];

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          Object.keys(item).forEach((subKey) => {
            formData.append(`${key}[${index}].${subKey}`, item[subKey]);
          });
        });
      } else if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    handleClose();

    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/MenuList/UpdateMenuItem`, {
      method: "POST",
      body: formData,
      headers: {
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
              Description: item.description || null,
              CategoryId: item.categoryId || null,
              SubCategoryId: item.subCategoryId || null,
              KitchenId: item.kitchenId || null,
              IsActive: item.isActive || false,
              IsComboMeal: item.isComboMeal || false,
              IsInventoryItem: item.isInventoryItem || false,
              IsWebView: item.isWebView || false,
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
                    Edit Menu Item
                  </Typography>
                </Box>
                <Box sx={{ maxHeight: '70vh', overflowY: 'scroll' }}>
                  <Grid spacing={1} container>
                    <Grid item xs={12} mt={1}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} order={{ xs: 2, lg: 1 }} lg={8}>
                          <Grid container>
                            <Grid item xs={12} mt={1}>
                              <Typography
                                sx={{
                                  fontWeight: "500",
                                  fontSize: "14px",
                                  mb: "5px",
                                }}
                              >
                                Name
                              </Typography>
                              <Field
                                as={TextField}
                                fullWidth
                                name="Name"
                                error={touched.Name && Boolean(errors.Name)}
                                helperText={touched.Name && errors.Name}
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
                                Description
                              </Typography>
                              <Field
                                as={TextField}
                                fullWidth
                                name="Description"
                              />
                            </Grid>
                          </Grid>
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          order={{ xs: 1, lg: 2 }}
                          lg={4}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: { xs: 200, lg: 'auto' },
                            position: 'relative'
                          }}
                        >
                          <Box
                            sx={{
                              flex: 1,
                              border: '1px solid #e5e5e5',
                              borderRadius: 1,
                              p: 2,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              cursor: 'pointer',
                              backgroundColor: '#fafafa',
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                            onClick={() => document.getElementById('image-upload-input').click()}
                          >
                            {image ? (
                              <>
                                <img
                                  src={image}
                                  alt="uploaded"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain',
                                    borderRadius: '4px'
                                  }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation(); 
                                    setImage(null);
                                    setFile(null);
                                  }}
                                  sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    backgroundColor: 'rgba(255,255,255,0.7)',
                                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                                  }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Click to upload image
                              </Typography>
                            )}
                          </Box>
                          <input
                            id="image-upload-input"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageChange}
                          />
                        </Grid>

                      </Grid>
                    </Grid>
                    <Grid item xs={12} lg={4} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Kitchen
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">
                          Kitchen
                        </InputLabel>
                        <Field
                          as={Select}
                          labelId="category-select-label"
                          id="category-select"
                          name="KitchenId"
                          label="Category"
                          value={values.KitchenId}
                          onChange={(e) => {
                            setFieldValue("KitchenId", e.target.value);
                          }}
                        >
                          {kitchens.length === 0 ? (
                            <MenuItem disabled color="error">
                              No Kitchens Available
                            </MenuItem>
                          ) : (
                            kitchens.map((kitchen, index) => (
                              <MenuItem
                                key={index}
                                value={kitchen.id}
                              >
                                {kitchen.code} - {kitchen.name}
                              </MenuItem>
                            ))
                          )}
                        </Field>
                        {touched.KitchenId && Boolean(errors.KitchenId) && (
                          <Typography variant="caption" color="error">
                            {errors.KitchenId}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} lg={4} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Category
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">
                          Category
                        </InputLabel>
                        <Field
                          as={Select}
                          labelId="category-select-label"
                          id="category-select"
                          name="CategoryId"
                          label="Category"
                          value={values.CategoryId}
                          onChange={(e) => {
                            setFieldValue("CategoryId", e.target.value);
                            setFieldValue("SubCategoryId", null);
                            handleGetSubCategories(e.target.value);
                          }}
                        >
                          {categories.length === 0 ? (
                            <MenuItem disabled color="error">
                              No Categories Available
                            </MenuItem>
                          ) : (
                            categories.map((category, index) => (
                              <MenuItem
                                disabled={!category.isActive}
                                key={index}
                                value={category.id}
                              >
                                {category.name}{" "}
                                {!category.isActive ? (
                                  <>
                                    &nbsp;
                                    <span className="dangerBadge">
                                      Inactive
                                    </span>
                                  </>
                                ) : (
                                  ""
                                )}
                              </MenuItem>
                            ))
                          )}
                        </Field>
                        {touched.CategoryId && Boolean(errors.CategoryId) && (
                          <Typography variant="caption" color="error">
                            {errors.CategoryId}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} lg={4} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Sub Category
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">
                          Sub Category
                        </InputLabel>
                        <Field
                          as={Select}
                          labelId="category-select-label"
                          id="category-select"
                          name="SubCategoryId"
                          label="Category"
                          value={values.SubCategoryId}
                          onChange={(e) => {
                            setFieldValue("SubCategoryId", e.target.value);
                          }}
                        >
                          {subCategories.length === 0 ? (
                            <MenuItem disabled color="error">
                              No Sub Categories Available
                            </MenuItem>
                          ) : (
                            subCategories.map((category, index) => (
                              <MenuItem
                                disabled={!category.isActive}
                                key={index}
                                value={category.id}
                              >
                                {category.name}{" "}
                                {!category.isActive ? (
                                  <>
                                    &nbsp;
                                    <span className="dangerBadge">
                                      Inactive
                                    </span>
                                  </>
                                ) : (
                                  ""
                                )}
                              </MenuItem>
                            ))
                          )}
                        </Field>
                        {touched.SubCategoryId && Boolean(errors.SubCategoryId) && (
                          <Typography variant="caption" color="error">
                            {errors.SubCategoryId}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <Typography variant="h6">Add Price Details</Typography>
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <Autocomplete
                        fullWidth
                        options={portions}
                        getOptionLabel={(option) => option.name || ""}
                        onChange={(event, newValue) => {
                          if (newValue) {
                            handleSetPortionPrices(newValue);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label="Select Portion" variant="outlined" />
                        )}
                        clearOnBlur
                        clearOnEscape
                      />
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Portion</TableCell>
                              <TableCell>Selling Price</TableCell>
                              <TableCell>Cost Price</TableCell>
                              <TableCell>Tax</TableCell>
                              <TableCell>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {priceList.length === 0 ?
                              <Typography p={1} color="error">No Data Available</Typography> :
                              (priceList.map((portion, index) => (
                                <TableRow key={index}>
                                  <TableCell>{portion.portionName}</TableCell>
                                  <TableCell>
                                    <TextField
                                      sx={{ minWidth: '100px' }}
                                      fullWidth
                                      size="small"
                                      value={portion.sellingPrice}
                                      onChange={(e) => handlePriceChange(index, "sellingPrice", e.target.value)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      fullWidth
                                      sx={{ minWidth: '100px' }}
                                      size="small"
                                      value={portion.costPrice}
                                      onChange={(e) => handlePriceChange(index, "costPrice", e.target.value)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      sx={{ minWidth: '100px' }}
                                      fullWidth
                                      size="small"
                                      value={portion.tax}
                                      onChange={(e) => handlePriceChange(index, "tax", e.target.value)}
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <IconButton
                                      color="error"
                                      onClick={() => handleDeletePortion(index)}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              )))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                    <Grid item xs={6} lg={4} mt={1}>
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
                    <Grid item xs={6} lg={4} mt={1}>
                      <FormControlLabel
                        control={
                          <Field
                            as={Checkbox}
                            name="IsComboMeal"
                            checked={values.IsComboMeal}
                            onChange={() =>
                              setFieldValue("IsComboMeal", !values.IsComboMeal)
                            }
                          />
                        }
                        label="Combo Meal"
                      />
                    </Grid>
                    <Grid item xs={6} lg={4} mt={1}>
                      <FormControlLabel
                        control={
                          <Field
                            as={Checkbox}
                            name="IsInventoryItem"
                            checked={values.IsInventoryItem}
                            onChange={() =>
                              setFieldValue("IsInventoryItem", !values.IsInventoryItem)
                            }
                          />
                        }
                        label="Inventory Item"
                      />
                    </Grid>
                    <Grid item xs={6} lg={4} mt={1}>
                      <FormControlLabel
                        control={
                          <Field
                            as={Checkbox}
                            name="IsWebView"
                            checked={values.IsWebView}
                            onChange={() =>
                              setFieldValue("IsWebView", !values.IsWebView)
                            }
                          />
                        }
                        label="Is WebView"
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

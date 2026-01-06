import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
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
import CloseIcon from '@mui/icons-material/Close';
import { formatCurrency } from "@/components/utils/formatHelper";
import BorderColorIcon from "@mui/icons-material/BorderColor";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 900, md: 500, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Name is required"),
  SellingPrice: Yup.string().required("Price is required"),
});

export default function EditComboMeal({ fetchItems, item }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [actualPrice, setActualPrice] = useState(null);
  const [categoryCountArray, setCategoryCountArray] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mealList, setMealList] = useState([]);
  const handleOpen = () => {
    setImage(item.comboImage);

    const categories = Array.from({ length: item.categoryCount }, (_, i) => ({ id: i + 1 }));
    setCategoryCountArray(categories);

    const formattedMealList = item.mealItems.map(meal => ({
      menuListId: meal.menuListId,
      name: meal.itemName,
      pricing: meal.pricing,
      price: meal.sellingPrice,
      quantity: meal.qty,
      portionId: meal.portionId,
      categoryId: meal.categoryId,
      isOptional: meal.isOptional,
      isDefault: meal.isDefault
    }));
    setMealList(formattedMealList);
    setActualPrice(item.actualPrice);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setFile(null);
  };
  const [image, setImage] = useState(null);
  const { data: menuList } = useApi("/MenuList/GetAll");

  useEffect(() => {
    if (menuList) {
      setMenuItems(menuList);
    }
  }, [menuList]);

  const handleChange = (index, field, value) => {
    setMealList((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;

        if (field === "portionId") {
          const selectedPortion = p.pricing.find((x) => x.portionId === value);
          return {
            ...p,
            portionId: value,
            price: selectedPortion ? selectedPortion.sellingPrice : null,
          };
        }

        return { ...p, [field]: value };
      })
    );
  };

  const handleSetCategories = (count) => {
    const categories = Array.from({ length: count }, (_, i) => ({ id: i + 1 }));
    setCategoryCountArray(categories);
    setMealList(prev =>
      prev.map(meal => ({
        ...meal,
        categoryId: null,
        isDefault: false,
        isOptional: false
      }))
    );
  }

  useEffect(() => {

    const total = mealList.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);

    setActualPrice(total);
  }, [mealList]);


  const handleSetMealList = (item, count) => {
    if (!count) {
      toast.info("Please Enter Category Count");
      return;
    }
    const newItem = {
      menuListId: item.id,
      name: item.name,
      pricing: item.pricing,
      price: null,
      quantity: 1,
      portionId: null,
      categoryId: null,
      isOptional: false,
      isDefault: false
    };

    setMealList((prev) => {
      if (prev.some((p) => p.menuListId === newItem.menuListId)) {
        toast.warning("This Item is already added!");
        return prev;
      }
      return [...prev, newItem];
    });

    setSelectedItem(null);
  };

  const handleCheckboxChange = (index, field) => {
    setMealList((prev) => {
      const currentItem = prev[index];
      const currentCategoryId = currentItem.categoryId;

      const itemsInCategory = prev.filter(
        (x) => x.categoryId === currentCategoryId
      );

      if (itemsInCategory.length <= 1) return prev;

      return prev.map((item, i) => {
        if (field === "isDefault") {
          if (item.categoryId === currentCategoryId) {
            return { ...item, isDefault: i === index };
          }
        }
        if (i === index && field === "isOptional") {
          return { ...item, isOptional: !item.isOptional };
        }
        return item;
      });
    });
  };


  const handleDelete = (index) => {
    setMealList((prev) => prev.filter((_, i) => i !== index));
  };

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

  const validateMealList = (mealList) => {
    if (!mealList.length) {
      toast.error("At least one item is required.");
      return false;
    }

    for (const item of mealList) {
      if (!item.categoryId) {
        toast.error(`Category is required for ${item.name}`);
        return false;
      }
      if (!item.portionId) {
        toast.error(`Portion is required for ${item.name}`);
        return false;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error(`Quantity must be greater than 0 for ${item.name}`);
        return false;
      }
    }

    const grouped = mealList.reduce((acc, item) => {
      acc[item.categoryId] = acc[item.categoryId] || [];
      acc[item.categoryId].push(item);
      return acc;
    }, {});

    for (const [catId, items] of Object.entries(grouped)) {
      if (items.length > 1) {
        const defaults = items.filter((x) => x.isDefault);
        if (defaults.length !== 1) {
          toast.error(
            `Category ${catId} must have exactly one default item.`
          );
          return false;
        }

        const notOptional = items.filter((x) => !x.isOptional);
        if (notOptional.length > 0) {
          toast.error(
            `All items in category ${catId} must be optional.`
          );
          return false;
        }
      }
    }

    return true;
  };


  const handleSubmit = (values) => {

    if (!validateMealList(mealList)) return;
    const data = {
      ...values,
      SellingPrice: parseFloat(values.SellingPrice),
      CategoryCount: parseInt(values.CategoryCount),
      ActualPrice: actualPrice,
      ComboImage: file ? file : null,
      PrevImage: image ? image : null,
      ComboMealLineDetails: mealList.map((row) => ({
        CategoryId: row.categoryId,
        MenuListId: row.menuListId,
        PortionId: row.portionId,
        SellingPrice: row.price,
        IsOptional: row.isOptional,
        IsDefault: row.isDefault,
        Qty: parseInt(row.quantity)
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
    fetch(`${BASE_URL}/ComboMeal/UpdateComboMeal`, {
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
              Description: item.description || "",
              CategoryCount: item.categoryCount || null,
              SellingPrice: item.sellingPrice || null,
              IsActive: item.isActive,
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
                    Edit Combo Meal
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
                    <Grid item xs={12} mt={1}>
                      <Typography variant="h6">Add Menu Items</Typography>
                    </Grid>
                    <Grid item xs={12} lg={8} mt={1}>
                      <Autocomplete
                        fullWidth
                        options={menuItems}
                        value={selectedItem}
                        getOptionLabel={(option) => option?.name || ""}
                        onChange={(event, newValue) => {
                          if (newValue) handleSetMealList(newValue, values.CategoryCount);
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label="Select Items" variant="outlined" />
                        )}
                        clearOnBlur
                        clearOnEscape
                      />

                    </Grid>
                    <Grid item xs={12} lg={4} mt={1}>
                      <Field
                        as={TextField}
                        fullWidth
                        name="CategoryCount"
                        type="number"
                        placeholder="Category Count"
                        onChange={(e) => {
                          handleSetCategories(e.target.value);
                          setFieldValue("CategoryCount", e.target.value)
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Category</TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell>Portion</TableCell>
                              <TableCell>Quantity</TableCell>
                              <TableCell>Is Default</TableCell>
                              <TableCell>Is Optional</TableCell>
                              <TableCell>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {mealList.length === 0 ?
                              <Typography p={1} color="error">No Data Available</Typography> :
                              (mealList.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Select sx={{ width: '80px' }} value={item.categoryId} size="small" onChange={(e) => handleChange(index, "categoryId", e.target.value)}>
                                      {categoryCountArray.length === 0 ?
                                        <MenuItem>No Data Available</MenuItem> : (
                                          categoryCountArray.map((cat, i) => (
                                            <MenuItem key={i} value={cat.id}>
                                              {cat.id}
                                            </MenuItem>
                                          ))
                                        )}
                                    </Select>
                                  </TableCell>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>
                                    <Select sx={{ width: '150px' }} value={item.portionId} size="small" onChange={(e) => handleChange(index, "portionId", e.target.value)}>
                                      {item.pricing.length === 0 ?
                                        <MenuItem>No Data Available</MenuItem> : (
                                          item.pricing.map((price, i) => (
                                            <MenuItem key={i} value={price.portionId}>
                                              {price.portionName} - {formatCurrency(price.sellingPrice)}
                                            </MenuItem>
                                          ))
                                        )}
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <TextField sx={{ width: '80px' }} size="small" value={item.quantity} onChange={(e) => handleChange(index, 'quantity', e.target.value)} />
                                  </TableCell>
                                  <TableCell>
                                    <Checkbox
                                      checked={item.isDefault}
                                      disabled={
                                        mealList.filter((x) => x.categoryId === item.categoryId).length <= 1
                                      }
                                      onChange={() => handleCheckboxChange(index, "isDefault")}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Checkbox
                                      checked={item.isOptional}
                                      disabled={
                                        mealList.filter((x) => x.categoryId === item.categoryId).length <= 1
                                      }
                                      onChange={() => handleCheckboxChange(index, "isOptional")}
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <IconButton
                                      color="error"
                                      onClick={() => handleDelete(index)}
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
                    <Grid item xs={12} lg={6} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Actual Price
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        value={actualPrice}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} lg={6} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Selling Price
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="SellingPrice"
                        error={touched.SellingPrice && Boolean(errors.SellingPrice)}
                        helperText={touched.SellingPrice && errors.SellingPrice}
                      />
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

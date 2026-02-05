import React, { useEffect, useRef, useState } from "react";
import { Checkbox, FormControlLabel, Grid, Typography, Tabs, Tab, IconButton, Select, InputLabel } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ChartOfAccountType } from "@/components/types/types";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

// Controlled Category Modal Component - Using existing AddCategory component logic
const CreateCategoryModal = ({ open, onClose, fetchItems, IsEcommerceWebSiteAvailable }) => {
  const [image, setImage] = useState("");
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } else {
      setImage("");
      setFile(null);
    }
  }, [open]);

  const handleSubmit = (values) => {
    const formData = new FormData();
    formData.append("Name", values.Name);
    formData.append("IsActive", values.IsActive);
    formData.append("IsWebView", values.IsWebView);
    formData.append("File", file ? file : null);

    fetch(`${BASE_URL}/Category/CreateCategory`, {
      method: "POST",
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          onClose();
          if (fetchItems) fetchItems();
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || '');
      });
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} className="bg-black">
        <Formik
          initialValues={{
            Name: "",
            IsActive: true,
            IsWebView: false,
          }}
          validationSchema={Yup.object().shape({
            Name: Yup.string().required("Category Name is required"),
          })}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form>
              <Box mt={2}>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
                      Add Category
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                      Category Name
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      inputRef={inputRef}
                      name="Name"
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>
                  <Grid item xs={12} lg={6} mt={2}>
                    <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                      Category Image
                    </Typography>
                    <Button
                      component="label"
                      variant="contained"
                      tabIndex={-1}
                      startIcon={<CloudUploadIcon />}
                    >
                      Upload Image
                      <input
                        type="file"
                        hidden
                        onChange={(event) => {
                          var file = event.target.files[0];
                          setFile(file);
                          setImage(URL.createObjectURL(file));
                        }}
                        multiple
                      />
                    </Button>
                  </Grid>
                  {image != "" && (
                    <Grid item xs={12} lg={6} my={1} display="flex" justifyContent="center">
                      <Box sx={{ p: 2, border: '1px solid #e5e5e5', borderRadius: '10px' }}>
                        <Box sx={{ width: 150, height: 150, backgroundSize: 'cover', backgroundImage: `url(${image})` }}></Box>
                      </Box>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Grid container spacing={1}>
                      <Grid item xs={12} lg={6} mt={1}>
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
                      {IsEcommerceWebSiteAvailable && (
                        <Grid item xs={12} lg={6} mt={1}>
                          <FormControlLabel
                            control={
                              <Field
                                as={Checkbox}
                                name="IsWebView"
                                checked={values.IsWebView}
                                onChange={() => setFieldValue("IsWebView", !values.IsWebView)}
                              />
                            }
                            label="Show in web"
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Button type="submit" variant="contained" onClick={onClose} color="error" sx={{ mt: 2, textTransform: "capitalize", borderRadius: "8px", fontWeight: "500", fontSize: "13px", padding: "12px 20px", color: "#fff !important" }}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" sx={{ mt: 2, textTransform: "capitalize", borderRadius: "8px", fontWeight: "500", fontSize: "13px", padding: "12px 20px", color: "#fff !important" }}>
                  Save
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  );
};

// Controlled SubCategory Modal Component
const CreateSubCategoryModal = ({ open, onClose, fetchItems, IsEcommerceWebSiteAvailable, preselectedCategoryId }) => {
  const [categoryList, setCategoryList] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetchCategoryList();
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  const fetchCategoryList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Category/GetAllCategory`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setCategoryList(data.result);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/SubCategory/CreateSubCategory`, {
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
          onClose();
          if (fetchItems) fetchItems(data.result?.id);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} className="bg-black">
        <Formik
          initialValues={{
            Name: "",
            CategoryId: preselectedCategoryId || "",
            IsActive: true,
            IsWebView: false,
          }}
          validationSchema={Yup.object().shape({
            Name: Yup.string().required("Sub Category Name is required"),
            CategoryId: Yup.number().required("Category is required"),
          })}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form>
              <Box mt={2}>
                <Grid container>
                  <Grid item xs={12} mt={1}>
                    <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                      Category
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel id="category-select-label">Category</InputLabel>
                      <Field
                        as={Select}
                        labelId="category-select-label"
                        id="category-select"
                        name="CategoryId"
                        label="Category"
                        value={values.CategoryId}
                        onChange={(e) => setFieldValue("CategoryId", e.target.value)}
                      >
                        {categoryList.length === 0 ? (
                          <MenuItem disabled color="error">No Categories Available</MenuItem>
                        ) : (
                          categoryList.map((category, index) => (
                            <MenuItem disabled={!category.isActive} key={index} value={category.id}>
                              {category.name} {!category.isActive && <span className="dangerBadge">Inactive</span>}
                            </MenuItem>
                          ))
                        )}
                      </Field>
                      {touched.CategoryId && Boolean(errors.CategoryId) && (
                        <Typography variant="caption" color="error">{errors.CategoryId}</Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                      Sub Category Name
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Name"
                      inputRef={inputRef}
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>
                  <Grid item xs={12} lg={6} mt={1}>
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
                  {IsEcommerceWebSiteAvailable && (
                    <Grid item xs={12} lg={6} mt={1}>
                      <FormControlLabel
                        control={
                          <Field
                            as={Checkbox}
                            name="IsWebView"
                            checked={values.IsWebView}
                            onChange={() => setFieldValue("IsWebView", !values.IsWebView)}
                          />
                        }
                        label="Show in web"
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Button type="submit" variant="contained" onClick={onClose} color="error" sx={{ mt: 2, textTransform: "capitalize", borderRadius: "8px", fontWeight: "500", fontSize: "13px", padding: "12px 20px", color: "#fff !important" }}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" sx={{ mt: 2, textTransform: "capitalize", borderRadius: "8px", fontWeight: "500", fontSize: "13px", padding: "12px 20px", color: "#fff !important" }}>
                  Save
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  );
};

// Controlled Supplier Modal Component
const CreateSupplierModal = ({ open, onClose, fetchItems, isPOSSystem, banks, isBankRequired, chartOfAccounts }) => {
  const [selectedBank, setSelectedBank] = useState();
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

  const handleSubmit = (values) => {
    if (!selectedBank && isBankRequired) {
      toast.warning("Please Select Bank");
      return;
    }
    const payload = {
      ...values,
      BankId: selectedBank?.id || null,
      BankName: selectedBank?.name || "",
      BankAccountUserName: selectedBank?.accountUsername || "",
      BankAccountNo: selectedBank?.accountNo || "",
    };

    fetch(`${BASE_URL}/Supplier/CreateSupplier`, {
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
          onClose();
          if (fetchItems) fetchItems(data.result?.id);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} className="bg-black">
        <Formik
          initialValues={{
            Name: "",
            MobileNo: "",
            PayableAccount: null,
            IsActive: true,
          }}
          validationSchema={Yup.object().shape({
            Name: Yup.string().required("Name is required"),
            MobileNo: Yup.string().required("Mobile No is required"),
          })}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form>
              <Box mt={2}>
                <Grid spacing={1} container>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
                      Add Supplier
                    </Typography>
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Supplier Name
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      inputRef={inputRef}
                      name="Name"
                      size="small"
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Mobile No
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="MobileNo"
                      size="small"
                      error={touched.MobileNo && Boolean(errors.MobileNo)}
                      helperText={touched.MobileNo && errors.MobileNo}
                    />
                  </Grid>
                  {isPOSSystem && (
                    <Grid item xs={12} mt={1}>
                      <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: "5px" }}>Email</Typography>
                      <Field as={TextField} fullWidth name="Email" size="small" />
                    </Grid>
                  )}
                  {isBankRequired && (
                    <Grid item xs={12} mt={1}>
                      <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: "5px" }}>Bank</Typography>
                      <Select
                        size="small"
                        fullWidth
                        onChange={(e) => {
                          const selected = banks.find((bank) => bank.id === e.target.value);
                          setSelectedBank(selected);
                        }}
                      >
                        {banks.length === 0 ? (
                          <MenuItem disabled>No Data Available</MenuItem>
                        ) : (
                          banks.map((bank, index) => (
                            <MenuItem key={index} value={bank.id}>
                              {bank.name} - {bank.accountUsername} ({bank.accountNo})
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </Grid>
                  )}
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Payable Account
                    </Typography>
                    <FormControl fullWidth>
                      <Field
                        as={TextField}
                        select
                        fullWidth
                        name="PayableAccount"
                        size="small"
                        onChange={(e) => setFieldValue("PayableAccount", e.target.value)}
                      >
                        {chartOfAccounts.length === 0 ? (
                          <MenuItem disabled>No Accounts Available</MenuItem>
                        ) : (
                          chartOfAccounts.map((acc, index) => (
                            <MenuItem key={index} value={acc.id}>
                              {acc.code} - {acc.description}
                            </MenuItem>
                          ))
                        )}
                      </Field>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} mt={1}>
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
                </Grid>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Button variant="contained" color="error" onClick={onClose} size="small">Cancel</Button>
                <Button type="submit" variant="contained" size="small">Save</Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  );
};

// Controlled UOM Modal Component
const CreateUOMModal = ({ open, onClose, fetchItems }) => {
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

  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/UnitOfMeasure/CreateUnitOfMeasure`, {
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
          onClose();
          if (fetchItems) fetchItems(data.result?.id);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} className="bg-black">
        <Formik
          initialValues={{
            Description: "",
            Name: "",
            Value: 0,
            IsActive: true,
          }}
          validationSchema={Yup.object().shape({
            Description: Yup.string().required("Description is required"),
            Name: Yup.string().required("Name is required"),
          })}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form>
              <Box>
                <Grid spacing={1} container>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
                      Add Unit of Measure
                    </Typography>
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Name</Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Name"
                      size="small"
                      inputRef={inputRef}
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Description</Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Description"
                      size="small"
                      error={touched.Description && Boolean(errors.Description)}
                      helperText={touched.Description && errors.Description}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Value</Typography>
                    <Field as={TextField} fullWidth type="number" name="Value" size="small" />
                  </Grid>
                  <Grid item xs={12} mt={1}>
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
                </Grid>
              </Box>
              <Box display="flex" mt={2} justifyContent="space-between">
                <Button variant="contained" color="error" onClick={onClose} size="small">Cancel</Button>
                <Button type="submit" variant="contained" size="small">Save</Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  );
};

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
  Name: Yup.string().required("Item Name is required"),
  Code: Yup.string().required("Item Code is required"),
  CategoryId: Yup.number().required("Category is required"),
  SubCategoryId: Yup.number().required("Sub Category is required"),
  Supplier: Yup.number().required("Supplier is required"),
  UOM: Yup.number().required("Unit of Measure is required"),
});

export default function AddItems({ fetchItems, isPOSSystem, uoms, isGarmentSystem, chartOfAccounts, barcodeEnabled, IsEcommerceWebSiteAvailable }) {
  const [itemCode, setItemCode] = useState(null);
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);
  const [selectedCat, setSelectedCat] = useState();
  const [categoryList, setCategoryList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [currencyList, setCurrencyList] = useState([]);
  const inputRef = useRef(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createSubCategoryOpen, setCreateSubCategoryOpen] = useState(false);
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);
  const [createUOMOpen, setCreateUOMOpen] = useState(false);
  const [uomList, setUomList] = useState(uoms || []);

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
    try {
      const response = await fetch(
        `${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=13`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const result = await response.json();
      setItemCode(result.result);
    } catch (err) {
      //
    }
    setOpen(true);
  };

  const fetchSupplierList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Supplier/GetAllSupplier`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Supplier List");
      }

      const data = await response.json();
      setSupplierList(data.result);
    } catch (error) {
      console.error("Error fetching Supplier List:", error);
    }
  };
  const fetchCategoryList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Category/GetAllCategory`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setCategoryList(data.result);
    } catch (error) {
      console.error("Error", error);
    }
  };
  const fetchSubCategoryList = async (id) => {
    try {
      const response = await fetch(
        `${BASE_URL}/SubCategory/GetAllSubCategory`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      const filteredItems = data.result.filter(
        (item) => item.categoryId === id
      );
      setSubCategoryList(filteredItems);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const fetchCurrencyList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Currency/GetAllCurrency?SkipCount=0&MaxResultCount=1000&Search=null`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Currency List");
      }

      const data = await response.json();
      console.log("Currency API Response:", data);
      
      // Extract currencies from paginated response
      // Response structure: { statusCode: 200, message: "...", result: { items: [...], totalCount: ... } }
      let currencies = [];
      if (data.result && data.result.items) {
        currencies = data.result.items;
      } else if (Array.isArray(data.result)) {
        currencies = data.result;
      }
      
      console.log("Extracted currencies:", currencies);
      
      // Filter only active currencies (isActive !== false means isActive === true or isActive === null/undefined)
      const activeCurrencies = currencies.filter(currency => currency.isActive !== false);
      console.log("Active currencies:", activeCurrencies);
      setCurrencyList(activeCurrencies);
    } catch (error) {
      console.error("Error fetching Currency List:", error);
    }
  };

  useEffect(() => {
    fetchCategoryList();
    fetchSupplierList();
    fetchCurrencyList();
    fetchUOMList();
  }, []);

  useEffect(() => {
    // Update UOM list when prop changes
    if (uoms && uoms.length > 0) {
      setUomList(uoms);
    }
  }, [uoms]);

  const fetchUOMList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/UnitOfMeasure/GetAllUnitOfMeasure`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch UOM list");
      }

      const data = await response.json();
      setUomList(data.result || []);
    } catch (error) {
      console.error("Error fetching UOM list:", error);
    }
  };

  const handleCategorySelect = (event) => {
    setSelectedCat(event.target.value);
    fetchSubCategoryList(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setSelectedFile(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
  };

  const handleCategoryCreated = async () => {
    await fetchCategoryList();
  };

  const handleSubCategoryCreated = async (setFieldValue, createdId) => {
    await fetchSubCategoryList(selectedCat);
    if (createdId && setFieldValue) {
      setFieldValue("SubCategoryId", createdId);
    }
  };

  const handleSupplierCreated = async (setFieldValue, createdId) => {
    await fetchSupplierList();
    if (createdId && setFieldValue) {
      setFieldValue("Supplier", createdId);
    }
  };

  const handleUOMCreated = async (setFieldValue, createdId) => {
    await fetchUOMList();
    if (createdId && setFieldValue) {
      setFieldValue("UOM", createdId);
    }
  };

  const handleSubmit = (values) => {
    if (values.IsWebView && values.AveragePrice === null) {
      toast.warning("Please enter the average price for web view.");
      return;
    }
    const formData = new FormData();

    formData.append("Name", values.Name);
    formData.append("Code", values.Code);
    formData.append("AveragePrice", values.AveragePrice);
    formData.append("ShipmentTarget", values.ShipmentTarget ? values.ShipmentTarget : "");
    formData.append("ReorderLevel", values.ReorderLevel ?values.ReorderLevel : "");
    formData.append("CategoryId", values.CategoryId);
    formData.append("SubCategoryId", values.SubCategoryId);
    formData.append("Supplier", values.Supplier);
    formData.append("UOM", values.UOM);
    if (values.CurrencyId) {
      formData.append("CurrencyId", values.CurrencyId);
    }
    if (values.Barcode !== undefined && values.Barcode !== null && values.Barcode !== "") {
      formData.append("Barcode", values.Barcode);
    }
    formData.append("CostAccount", values.CostAccount ? values.CostAccount : "");
    formData.append("AssetsAccount", values.AssetsAccount ? values.AssetsAccount : "");
    formData.append("IncomeAccount", values.IncomeAccount ? values.IncomeAccount : "");
    formData.append("IsActive", values.IsActive);
    formData.append("IsNonInventoryItem", values.IsNonInventoryItem);
    formData.append("HasSerialNumbers", values.HasSerialNumbers);
    formData.append("IsWebView", values.IsWebView);
    formData.append("ProductImage", selectedFile ? selectedFile : null);
    if (values.Description && values.Description.trim() !== "") {
      formData.append("Description", values.Description);
    }

    fetch(`${BASE_URL}/Items/CreateItems`, {
      method: "POST",
      body: formData,
      headers: {
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
        + new item
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
              Name: "",
              Code: itemCode,
              AveragePrice: null,
              ShipmentTarget: null,
              ReorderLevel: null,
              CategoryId: "",
              SubCategoryId: "",
              Supplier: "",
              UOM: "",
              CurrencyId: "",
              Barcode: null,
              CostAccount: null,
              AssetsAccount: null,
              IncomeAccount: null,
              IsActive: true,
              IsNonInventoryItem: false,
              HasSerialNumbers: false,
              IsWebView: false,
              Description: ""
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, resetForm }) => {
              // Store setFieldValue in component scope for modal handlers
              window.currentSetFieldValue = setFieldValue;
              return (
              <Form>
                <Grid container>
                  <Grid item mb={2} xs={12}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Add Item
                    </Typography>
                  </Grid>
                  <Grid item xs={12} mb={2}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="item tabs">
                      <Tab label="Item Details" />
                      <Tab label="Image" />
                    </Tabs>
                  </Grid>

                  {tabValue === 0 && (
                    <Box sx={{ height: "50vh", overflowY: "scroll", width: "100%" }}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} lg={6}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              mb: "5px",
                            }}
                          >
                            Item Name
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name="Name"
                            size="small"
                            inputRef={inputRef}
                            error={touched.Name && Boolean(errors.Name)}
                            helperText={touched.Name && errors.Name}
                          />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Item Code
                          </Typography>
                          <Field
                            as={TextField}
                            size="small"
                            fullWidth
                            name="Code"
                            error={touched.Code && Boolean(errors.Code)}
                            helperText={touched.Code && errors.Code}
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
                            Category
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                            <FormControl fullWidth>
                              <Field
                                as={TextField}
                                select
                                fullWidth
                                name="CategoryId"
                                size="small"
                                onChange={(e) => {
                                  setFieldValue("CategoryId", e.target.value);
                                  handleCategorySelect(e);
                                }}
                              >
                              {categoryList.length === 0 ? (
                                <MenuItem disabled color="error">
                                  No Categories Available
                                </MenuItem>
                              ) : (
                                categoryList.map((category, index) => (
                                  <MenuItem key={index} value={category.id}>
                                    {category.name}
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
                            <IconButton
                              size="small"
                              onClick={() => setCreateCategoryOpen(true)}
                              sx={{ mt: 0.5 }}
                              color="primary"
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                        <Grid item xs={12} lg={6} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Sub Category
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                            <FormControl fullWidth>
                              <Field
                                as={TextField}
                                select
                                fullWidth
                                name="SubCategoryId"
                                size="small"
                                onChange={(e) => {
                                  setFieldValue("SubCategoryId", e.target.value);
                                }}
                              >
                              {!selectedCat ? (
                                <MenuItem disabled>
                                  Please Select Category First
                                </MenuItem>
                              ) : subCategoryList.length === 0 ? (
                                <MenuItem disabled>
                                  No Sub Categories Available
                                </MenuItem>
                              ) : (
                                subCategoryList.map((subcategory, index) => (
                                  <MenuItem key={index} value={subcategory.id}>
                                    {subcategory.name}
                                  </MenuItem>
                                ))
                              )}
                              </Field>
                              {touched.SubCategoryId &&
                                Boolean(errors.SubCategoryId) && (
                                  <Typography variant="caption" color="error">
                                    {errors.SubCategoryId}
                                  </Typography>
                                )}
                            </FormControl>
                            {selectedCat && (
                              <IconButton
                                size="small"
                                onClick={() => setCreateSubCategoryOpen(true)}
                                sx={{ mt: 0.5 }}
                                color="primary"
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </Grid>
                        <Grid item xs={12} lg={6} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Supplier
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                            <FormControl fullWidth>
                              <Field
                                as={TextField}
                                select
                                fullWidth
                                name="Supplier"
                                size="small"
                                onChange={(e) => {
                                  setFieldValue("Supplier", e.target.value);
                                }}
                              >
                              {supplierList.length === 0 ? (
                                <MenuItem disabled>
                                  No Suppliers Available
                                </MenuItem>
                              ) : (
                                supplierList.map((supplier, index) => (
                                  <MenuItem key={index} value={supplier.id}>
                                    {supplier.name}
                                  </MenuItem>
                                ))
                              )}
                              </Field>
                              {touched.Supplier && Boolean(errors.Supplier) && (
                                <Typography variant="caption" color="error">
                                  {errors.Supplier}
                                </Typography>
                              )}
                            </FormControl>
                            <IconButton
                              size="small"
                              onClick={() => setCreateSupplierOpen(true)}
                              sx={{ mt: 0.5 }}
                              color="primary"
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                        {isPOSSystem && (
                          <>
                            <Grid item xs={12} mt={1} lg={6}>
                              <Typography
                                sx={{
                                  fontWeight: "500",
                                  fontSize: "14px",
                                  mb: "5px",
                                }}
                              >
                                Average Price
                              </Typography>
                              <Field
                                as={TextField}
                                fullWidth
                                name="AveragePrice"
                                size="small"
                              />
                            </Grid>
                          </>
                        )}
                        <Grid item xs={12} mt={1} lg={6}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Reorder Level
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name="ReorderLevel"
                            size="small"
                            type="number"
                            onChange={(e) => {
                              const value = e.target.value;
                              setFieldValue("ReorderLevel", value === '' ? null : value);
                            }}
                          />
                        </Grid>
                        {isGarmentSystem && (
                          <>
                            <Grid item xs={12} mt={1} lg={6}>
                              <Typography
                                sx={{
                                  fontWeight: "500",
                                  fontSize: "14px",
                                  mb: "5px",
                                }}
                              >
                                Shipment Target
                              </Typography>
                              <Field
                                as={TextField}
                                fullWidth
                                name="ShipmentTarget"
                                size="small"
                                type="number"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFieldValue("ShipmentTarget", value === '' ? null : value);
                                }}
                              />
                            </Grid>
                          </>
                        )}
                        <Grid item xs={12} lg={6} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Unit of Measure
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                            <FormControl fullWidth>
                              <Field
                                as={TextField}
                                select
                                fullWidth
                                name="UOM"
                                size="small"
                              >
                              {uomList.filter(uom => uom.isActive).length === 0 ? (
                                <MenuItem disabled>No Active UOM Available</MenuItem>
                              ) : (
                                uomList
                                  .filter(uom => uom.isActive)
                                  .map((uom, index) => (
                                    <MenuItem key={index} value={uom.id}>
                                      {uom.name}
                                    </MenuItem>
                                  ))
                              )
                              }
                              </Field>
                              {touched.UOM && Boolean(errors.UOM) && (
                                <Typography variant="caption" color="error">
                                  {errors.UOM}
                                </Typography>
                              )}
                            </FormControl>
                            <IconButton
                              size="small"
                              onClick={() => setCreateUOMOpen(true)}
                              sx={{ mt: 0.5 }}
                              color="primary"
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                        <Grid item xs={12} lg={6} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Select Currency
                          </Typography>
                          <FormControl fullWidth>
                            <Field
                              as={TextField}
                              select
                              fullWidth
                              name="CurrencyId"
                              size="small"
                              onChange={(e) => {
                                setFieldValue("CurrencyId", e.target.value);
                              }}
                            >
                              {currencyList.length === 0 ? (
                                <MenuItem disabled>
                                  No Currencies Available
                                </MenuItem>
                              ) : (
                                currencyList.map((currency, index) => (
                                  <MenuItem key={index} value={currency.id}>
                                    {currency.code} - {currency.name}
                                  </MenuItem>
                                ))
                              )}
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} lg={6} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Cost Account
                          </Typography>
                          <FormControl fullWidth>
                            <Field
                              as={TextField}
                              select
                              fullWidth
                              name="CostAccount"
                              size="small"
                              onChange={(e) => {
                                setFieldValue("CostAccount", e.target.value);
                              }}
                            >
                              {chartOfAccounts.length === 0 ? (
                                <MenuItem disabled>
                                  No Accounts Available
                                </MenuItem>
                              ) : (
                                chartOfAccounts.map((acc, index) => (
                                  <MenuItem key={index} value={acc.id}>
                                    {acc.code} - {acc.description}
                                  </MenuItem>
                                ))
                              )}
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} lg={6} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Income Account
                          </Typography>
                          <FormControl fullWidth>
                            <Field
                              as={TextField}
                              select
                              fullWidth
                              name="IncomeAccount"
                              size="small"
                              onChange={(e) => {
                                setFieldValue("IncomeAccount", e.target.value);
                              }}
                            >
                              {chartOfAccounts.length === 0 ? (
                                <MenuItem disabled>
                                  No Accounts Available
                                </MenuItem>
                              ) : (
                                chartOfAccounts.map((acc, index) => (
                                  <MenuItem key={index} value={acc.id}>
                                    {acc.code} - {acc.description}
                                  </MenuItem>
                                ))
                              )}
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} lg={6} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Assets Account
                          </Typography>
                          <FormControl fullWidth>
                            <Field
                              as={TextField}
                              select
                              fullWidth
                              name="AssetsAccount"
                              size="small"
                              onChange={(e) => {
                                setFieldValue("AssetsAccount", e.target.value);
                              }}
                            >
                              {chartOfAccounts.length === 0 ? (
                                <MenuItem disabled>
                                  No Accounts Available
                                </MenuItem>
                              ) : (
                                chartOfAccounts.map((acc, index) => (
                                  <MenuItem key={index} value={acc.id}>
                                    {acc.code} - {acc.description}
                                  </MenuItem>
                                ))
                              )}
                            </Field>
                          </FormControl>
                        </Grid>
                        {barcodeEnabled && (
                          <Grid item xs={12} lg={6} mt={1}>
                            <Typography
                              sx={{
                                fontWeight: "500",
                                mb: "5px",
                              }}
                            >
                              Barcode
                            </Typography>
                            <Field
                              as={TextField}
                              fullWidth
                              name="Barcode"
                              size="small"
                            />
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
                            Description
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name="Description"
                            size="small"
                            multiline
                            rows={4}
                          />
                        </Grid>
                        <Grid item xs={12} p={1}>
                          <Grid container>
                            <Grid item xs={12} lg={6}>
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
                            <Grid item xs={12} lg={6}>
                              <FormControlLabel
                                control={
                                  <Field
                                    as={Checkbox}
                                    name="IsNonInventoryItem"
                                    checked={values.IsNonInventoryItem}
                                    onChange={() =>
                                      setFieldValue("IsNonInventoryItem", !values.IsNonInventoryItem)
                                    }
                                  />
                                }
                                label="Non Inventory Item"
                              />
                            </Grid>
                            <Grid item xs={12} lg={6}>
                              <FormControlLabel
                                control={
                                  <Field
                                    as={Checkbox}
                                    name="HasSerialNumbers"
                                    checked={values.HasSerialNumbers}
                                    onChange={() =>
                                      setFieldValue("HasSerialNumbers", !values.HasSerialNumbers)
                                    }
                                  />
                                }
                                label="Serial Numbers Available"
                              />
                            </Grid>

                            {IsEcommerceWebSiteAvailable && (
                              <Grid item xs={12} lg={6} mt={1}>
                                <FormControlLabel
                                  control={
                                    <Field
                                      as={Checkbox}
                                      name="IsWebView"
                                      checked={values.IsWebView}
                                      onChange={() => setFieldValue("IsWebView", !values.IsWebView)}
                                    />
                                  }
                                  label="Show in web"
                                />
                              </Grid>
                            )}
                          </Grid>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {tabValue === 1 && (
                    <Box sx={{ height: "50vh", overflowY: "scroll", width: "100%", p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Upload Item Image
                          </Typography>
                          <Button
                            variant="contained"
                            component="label"
                            startIcon={<CloudUploadIcon />}
                            sx={{ mb: 3 }}
                          >
                            Choose Image
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </Button>
                        </Grid>

                        {selectedImage && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                              Selected Image
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6} md={4}>
                                <Box
                                  sx={{
                                    position: "relative",
                                    border: "2px solid #e0e0e0",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    height: "250px",
                                    "&:hover .delete-icon": {
                                      opacity: 1,
                                    },
                                  }}
                                >
                                  <img
                                    src={selectedImage}
                                    alt="Preview"
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                  <IconButton
                                    className="delete-icon"
                                    onClick={handleRemoveImage}
                                    sx={{
                                      position: "absolute",
                                      top: 5,
                                      right: 5,
                                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                                      opacity: 0,
                                      transition: "opacity 0.3s",
                                      "&:hover": {
                                        backgroundColor: "rgba(255, 255, 255, 1)",
                                      },
                                    }}
                                    size="small"
                                  >
                                    <DeleteIcon fontSize="small" color="error" />
                                  </IconButton>
                                </Box>
                              </Grid>
                            </Grid>
                          </Grid>
                        )}

                        {!selectedImage && (
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                border: "2px dashed #ccc",
                                borderRadius: "8px",
                                p: 4,
                                textAlign: "center",
                                backgroundColor: "#f9f9f9",
                              }}
                            >
                              <CloudUploadIcon sx={{ fontSize: 60, color: "#999", mb: 2 }} />
                              <Typography variant="body1" color="textSecondary">
                                No image uploaded yet
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Click "Choose Image" button to upload
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  )}

                  <Grid container>
                    <Grid
                      display="flex"
                      justifyContent="space-between"
                      item
                      xs={12}
                      p={1}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        onClick={handleClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" size="small">
                        Save
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Form>
            );
            }}
          </Formik>
        </Box>
      </Modal>

      {/* Create Category Modal - Using existing component */}
      {createCategoryOpen && (
        <CreateCategoryModal
          open={createCategoryOpen}
          onClose={() => setCreateCategoryOpen(false)}
          fetchItems={handleCategoryCreated}
          IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable}
        />
      )}

      {/* Create SubCategory Modal - Using existing component */}
      {createSubCategoryOpen && (
        <CreateSubCategoryModal
          open={createSubCategoryOpen}
          onClose={() => setCreateSubCategoryOpen(false)}
          fetchItems={(createdId) => handleSubCategoryCreated(window.currentSetFieldValue, createdId)}
          IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable}
          preselectedCategoryId={selectedCat}
        />
      )}

      {/* Create Supplier Modal - Using existing component */}
      {createSupplierOpen && (
        <CreateSupplierModal
          open={createSupplierOpen}
          onClose={() => setCreateSupplierOpen(false)}
          fetchItems={(createdId) => handleSupplierCreated(window.currentSetFieldValue, createdId)}
          isPOSSystem={isPOSSystem}
          banks={[]}
          isBankRequired={false}
          chartOfAccounts={chartOfAccounts}
        />
      )}

      {/* Create UOM Modal - Using existing component */}
      {createUOMOpen && (
        <CreateUOMModal
          open={createUOMOpen}
          onClose={() => setCreateUOMOpen(false)}
          fetchItems={(createdId) => handleUOMCreated(window.currentSetFieldValue, createdId)}
        />
      )}
    </>
  );
}

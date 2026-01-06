import React, { useEffect, useState } from "react";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import "react-toastify/dist/ReactToastify.css";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";

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

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Sub Category Name is required"),
  CategoryId: Yup.number().required("Category is required"),
});

export default function EditSubCategory({ fetchItems, subcategory, IsEcommerceWebSiteAvailable }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);

  const handleClose = () => setOpen(false);

  const [categoryList, setCategoryList] = useState([]);

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
        throw new Error("Failed");
      }

      const data = await response.json();
      setCategoryList(data.result);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  useEffect(() => {
    fetchCategoryList();
  }, []);

  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/SubCategory/UpdateSubCategory`, {
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
              Id: subcategory.id,
              Name: subcategory.name || "",
              CategoryId: subcategory.categoryId || "",
              IsActive: subcategory.isActive,
              IsWebView: subcategory.isWebView,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Box mt={2}>
                  <Grid container>

                    <Grid item xs={12} mt={1}>
                      <Typography
                        as="h5"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "12px",
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
                          onChange={(e) =>
                            setFieldValue("CategoryId", e.target.value)
                          }
                        >
                          {categoryList.length === 0 ? (
                            <MenuItem disabled color="error">
                              No Categories Available
                            </MenuItem>
                          ) : (
                            categoryList.map((category, index) => (
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
                    <Grid item xs={12} mt={1}>
                      <Typography
                        as="h5"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "12px",
                        }}
                      >
                        Sub Category Name
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Name"
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
                            onChange={() =>
                              setFieldValue("IsActive", !values.IsActive)
                            }
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
                  <Button
                    type="submit"
                    variant="contained"
                    onClick={handleClose}
                    color="error"
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
                    Cancel
                  </Button>
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
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}

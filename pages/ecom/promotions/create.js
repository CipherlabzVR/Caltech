import React, { useState } from "react";
import { Grid, Box, Button } from "@mui/material";
import Modal from "@mui/material/Modal";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import PromotionFormFields from "./PromotionFormFields";
import { buildConfigJson } from "@/components/eCommerce/promotions/promotionConfig";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 640, xs: "95%" },
  maxHeight: "90vh",
  overflow: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Name is required"),
  PromotionCategory: Yup.string().required("Category is required"),
  PromotionType: Yup.string().required("Type is required"),
});

export default function AddPromotion({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = (values, { resetForm }) => {
    const configJson = buildConfigJson(values.PromotionType, values.ConfigValues);
    const payload = {
      Name: values.Name,
      Description: values.Description || null,
      PromotionCategory: values.PromotionCategory,
      PromotionType: values.PromotionType,
      CouponCode: values.CouponCode || null,
      StartDate: values.StartDate || null,
      EndDate: values.EndDate || null,
      IsActive: values.IsActive,
      ConfigJson: configJson != null ? JSON.stringify(configJson) : null,
    };

    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/ECommerce/CreatePromotion`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          resetForm();
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message || "Failed to create promotion");
        }
      })
      .catch((error) => {
        toast.error(error.message || "Request failed");
      });
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + Add promotion
      </Button>
      <Modal open={open} onClose={handleClose} aria-labelledby="modal-promotion-title">
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              Name: "",
              Description: "",
              PromotionCategory: "",
              PromotionType: "",
              CouponCode: "",
              StartDate: "",
              EndDate: "",
              IsActive: true,
              ConfigValues: {},
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Box>
                  <Grid container spacing={1}>
                    <PromotionFormFields
                      values={values}
                      setFieldValue={setFieldValue}
                      errors={errors}
                      touched={touched}
                      isEdit={false}
                    />
                  </Grid>
                </Box>
                <Box display="flex" mt={2} justifyContent="space-between">
                  <Button variant="contained" color="error" onClick={handleClose} size="small">
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

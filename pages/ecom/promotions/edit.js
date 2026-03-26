import React, { useState } from "react";
import { Grid, Box, Button, IconButton, Tooltip } from "@mui/material";
import Modal from "@mui/material/Modal";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import PromotionFormFields from "./PromotionFormFields";
import { buildConfigJson, parseConfigJson } from "@/components/eCommerce/promotions/promotionConfig";

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

function formatDateTimeLocal(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditPromotion({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const initialValues = {
    Id: item.id,
    Name: item.name || "",
    Description: item.description || "",
    PromotionCategory: item.promotionCategory || "",
    PromotionType: item.promotionType || "",
    CouponCode: item.couponCode || "",
    StartDate: formatDateTimeLocal(item.startDate),
    EndDate: formatDateTimeLocal(item.endDate),
    IsActive: item.isActive ?? true,
    ConfigValues: parseConfigJson(item.promotionType, item.configJson),
  };

  const handleSubmit = (values) => {
    const configJson = buildConfigJson(values.PromotionType, values.ConfigValues);
    const payload = {
      Id: values.Id,
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
    fetch(`${BASE_URL}/ECommerce/UpdatePromotion`, {
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
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message || "Failed to update promotion");
        }
      })
      .catch((error) => {
        toast.error(error.message || "Request failed");
      });
  };

  return (
    <>
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose} aria-labelledby="modal-edit-promotion-title">
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
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
                      isEdit={true}
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

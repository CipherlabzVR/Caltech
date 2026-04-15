import React, { useState } from "react";
import { Grid, Box, Button } from "@mui/material";
import Modal from "@mui/material/Modal";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import PromotionFormFields from "./PromotionFormFields";
import {
  buildPromotionCategoryLinesPayload,
  buildPromotionProductItemLinesPayload,
  buildPromotionTotalAmountLinesPayload,
  getValidCategoryDiscountRows,
  getValidProductItemDiscountRows,
  getValidTotalAmountRows,
  isPromotionApiSuccess,
  validateProductItemDiscountForm,
} from "@/components/eCommerce/promotions/promotionConfig";

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
  PromotionType: Yup.string().when("PromotionCategory", {
    is: (cat) => cat === "ProductBased" || cat === "TotalAmountBased",
    then: (schema) => schema.notRequired(),
    otherwise: (schema) => schema.required("Type is required"),
  }),
});

function buildBasePayload(values) {
  const isTa = values.PromotionCategory === "TotalAmountBased";
  const couponOn = isTa && values.IsCouponAvailable;
  const cat = String(values.PromotionCategory || "").trim();
  const noStandaloneCoupon =
    !cat ||
    isTa ||
    values.PromotionCategory === "ProductBased" ||
    values.PromotionCategory === "CategoryBased";
  return {
    name: values.Name,
    description: values.Description || null,
    promotionCategory: values.PromotionCategory,
    promotionType: values.PromotionType,
    couponCode: couponOn
      ? (values.CouponCode || "").trim() || null
      : noStandaloneCoupon
        ? null
        : values.CouponCode || null,
    isCouponAvailable: !!couponOn,
    couponDiscountType: couponOn ? Number(values.CouponDiscountType) : null,
    couponDiscountValue: couponOn && values.CouponDiscountValue !== "" && values.CouponDiscountValue != null
      ? Number(values.CouponDiscountValue)
      : couponOn
        ? 0
        : null,
    maxBillAmount: couponOn && values.MaxBillAmount !== "" && values.MaxBillAmount != null
      ? Number(values.MaxBillAmount)
      : null,
    isOneTimeUse: couponOn && !!values.IsOneTimeUse,
    startDate: values.StartDate || null,
    endDate: values.EndDate || null,
    isActive: values.IsActive,
  };
}

export default function AddPromotion({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setSubmitting(true);
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    try {
      if (values.PromotionType === "CategoryDiscount") {
        const rows = getValidCategoryDiscountRows(values.ConfigValues);
        if (rows.length === 0) {
          toast.error("Select at least one category");
          return;
        }
        const payload = {
          ...buildBasePayload(values),
          promotionCategoryLines: buildPromotionCategoryLinesPayload(rows),
        };
        const response = await fetch(`${BASE_URL}/ECommerce/CreatePromotion`, {
          method: "POST",
          body: JSON.stringify(payload),
          headers,
        });
        const data = await response.json();
        if (isPromotionApiSuccess(data)) {
          toast.success(data.message || "Promotion created successfully.");
          resetForm();
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message || "Failed to create promotion");
        }
        return;
      }

      if (values.PromotionType === "ProductItemDiscount") {
        const check = validateProductItemDiscountForm(values.ConfigValues);
        if (!check.ok) {
          toast.error(check.message);
          return;
        }
        const prodRows = getValidProductItemDiscountRows(values.ConfigValues);
        if (prodRows.length === 0) {
          toast.error("Select an item");
          return;
        }
        const payload = {
          ...buildBasePayload(values),
          promotionCategoryLines: buildPromotionProductItemLinesPayload(prodRows),
        };
        const response = await fetch(`${BASE_URL}/ECommerce/CreatePromotion`, {
          method: "POST",
          body: JSON.stringify(payload),
          headers,
        });
        const data = await response.json();
        if (isPromotionApiSuccess(data)) {
          toast.success(data.message || "Promotion created successfully.");
          resetForm();
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message || "Failed to create promotion");
        }
        return;
      }

      if (values.PromotionType === "TotalAmountDiscount") {
        if (values.IsCouponAvailable) {
          if (!String(values.CouponCode || "").trim()) {
            toast.error("Enter a coupon code when coupon is enabled.");
            return;
          }
          const cv = Number(values.CouponDiscountValue);
          if (!Number.isFinite(cv) || cv < 0) {
            toast.error("Enter a valid coupon discount value.");
            return;
          }
          if (Number(values.CouponDiscountType) === 2 && cv > 100) {
            toast.error("Coupon percentage cannot exceed 100.");
            return;
          }
          const payload = {
            ...buildBasePayload(values),
            promotionCategoryLines: null,
            promotionTotalAmountLines: null,
          };
          const response = await fetch(`${BASE_URL}/ECommerce/CreatePromotion`, {
            method: "POST",
            body: JSON.stringify(payload),
            headers,
          });
          const data = await response.json();
          if (isPromotionApiSuccess(data)) {
            toast.success(data.message || "Promotion created successfully.");
            resetForm();
            setOpen(false);
            fetchItems();
          } else {
            toast.error(data.message || "Failed to create promotion");
          }
          return;
        }
        const rows = getValidTotalAmountRows(values.PromotionTotalAmountLines);
        if (rows.length === 0) {
          toast.error("Add at least one tier with a positive max bill amount and discount.");
          return;
        }
        const payload = {
          ...buildBasePayload(values),
          promotionCategoryLines: null,
          promotionTotalAmountLines: buildPromotionTotalAmountLinesPayload(rows),
        };
        const response = await fetch(`${BASE_URL}/ECommerce/CreatePromotion`, {
          method: "POST",
          body: JSON.stringify(payload),
          headers,
        });
        const data = await response.json();
        if (isPromotionApiSuccess(data)) {
          toast.success(data.message || "Promotion created successfully.");
          resetForm();
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message || "Failed to create promotion");
        }
        return;
      }

      const payload = {
        ...buildBasePayload(values),
        promotionCategoryLines: null,
      };
      const response = await fetch(`${BASE_URL}/ECommerce/CreatePromotion`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers,
      });
      const data = await response.json();
      if (isPromotionApiSuccess(data)) {
        toast.success(data.message || "Promotion created successfully.");
        resetForm();
        setOpen(false);
        fetchItems();
      } else {
        toast.error(data.message || "Failed to create promotion");
      }
    } catch (error) {
      toast.error(error.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
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
              IsCouponAvailable: false,
              CouponDiscountType: 2,
              CouponDiscountValue: "",
              MaxBillAmount: "",
              IsOneTimeUse: false,
              StartDate: "",
              EndDate: "",
              IsActive: true,
              ConfigValues: {},
              PromotionTotalAmountLines: [],
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

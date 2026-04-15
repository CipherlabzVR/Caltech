import React, { useState, useEffect } from "react";
import { Grid, Box, Button, IconButton, Tooltip, CircularProgress } from "@mui/material";
import Modal from "@mui/material/Modal";
import BorderColorIcon from "@mui/icons-material/BorderColor";
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
  normalizeCategoryDiscountsFromApiLines,
  normalizeProductItemDiscountFromApiLines,
  normalizePromotionCategoryKey,
  normalizeTotalAmountLinesFromApi,
  parseConfigJson,
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

function formatDateTimeLocal(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

function buildInitialValues(promo) {
  if (!promo) return null;
  const pc = normalizePromotionCategoryKey(promo.promotionCategory) || promo.promotionCategory || "";
  const pt = promo.promotionType || "";
  let cfg = {};
  if (pt === "CategoryDiscount" && promo.promotionCategoryLines?.length) {
    cfg = normalizeCategoryDiscountsFromApiLines(promo.promotionCategoryLines);
  } else if (pt === "ProductItemDiscount" && promo.promotionCategoryLines?.length) {
    cfg = normalizeProductItemDiscountFromApiLines(promo.promotionCategoryLines);
  } else {
    cfg = parseConfigJson(pt, promo.configJson);
  }
  const totalLinesRaw = promo.promotionTotalAmountLines ?? promo.PromotionTotalAmountLines;
  const isTaCouponOnly = pt === "TotalAmountDiscount" && !!(promo.isCouponAvailable ?? promo.IsCouponAvailable);
  const promotionTotalAmountLines =
    pt === "TotalAmountDiscount"
      ? isTaCouponOnly
        ? []
        : normalizeTotalAmountLinesFromApi(Array.isArray(totalLinesRaw) ? totalLinesRaw : [])
      : [];

  return {
    Id: promo.id,
    Name: promo.name || "",
    Description: promo.description || "",
    PromotionCategory: pc,
    PromotionType: pt,
    CouponCode: promo.couponCode || "",
    IsCouponAvailable: !!(promo.isCouponAvailable ?? promo.IsCouponAvailable),
    CouponDiscountType:
      promo.couponDiscountType != null || promo.CouponDiscountType != null
        ? Number(promo.couponDiscountType ?? promo.CouponDiscountType)
        : 2,
    CouponDiscountValue:
      promo.couponDiscountValue != null || promo.CouponDiscountValue != null
        ? String(promo.couponDiscountValue ?? promo.CouponDiscountValue)
        : "",
    MaxBillAmount:
      promo.maxBillAmount != null || promo.MaxBillAmount != null
        ? String(promo.maxBillAmount ?? promo.MaxBillAmount)
        : "",
    IsOneTimeUse: !!(promo.isOneTimeUse ?? promo.IsOneTimeUse),
    IsUsed: !!(promo.isUsed ?? promo.IsUsed),
    StartDate: formatDateTimeLocal(promo.startDate),
    EndDate: formatDateTimeLocal(promo.endDate),
    IsActive: promo.isActive ?? true,
    ConfigValues: cfg,
    PromotionTotalAmountLines: promotionTotalAmountLines,
  };
}

export default function EditPromotion({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setDetail(null);
  };

  useEffect(() => {
    if (!open || !item?.id) return undefined;
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/ECommerce/GetPromotionById?id=${item.id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (cancelled) return;
        const payload = data.result;
        setDetail(payload ?? null);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, item?.id]);

  const initialValues = buildInitialValues(detail ?? item) || {
    Id: item.id,
    Name: item.name || "",
    Description: item.description || "",
    PromotionCategory: normalizePromotionCategoryKey(item.promotionCategory) || item.promotionCategory || "",
    PromotionType: item.promotionType || "",
    CouponCode: item.couponCode || "",
    IsCouponAvailable: false,
    CouponDiscountType: 2,
    CouponDiscountValue: "",
    MaxBillAmount: "",
    IsOneTimeUse: false,
    IsUsed: false,
    StartDate: formatDateTimeLocal(item.startDate),
    EndDate: formatDateTimeLocal(item.endDate),
    IsActive: item.isActive ?? true,
    ConfigValues: parseConfigJson(item.promotionType, item.configJson),
    PromotionTotalAmountLines: [],
  };

  const handleSubmit = async (values, { setSubmitting }) => {
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
          id: values.Id,
          ...buildBasePayload(values),
          promotionCategoryLines: buildPromotionCategoryLinesPayload(rows),
        };
        const response = await fetch(`${BASE_URL}/ECommerce/UpdatePromotion`, {
          method: "POST",
          body: JSON.stringify(payload),
          headers,
        });
        const data = await response.json();
        if (isPromotionApiSuccess(data)) {
          toast.success(data.message || "Promotion updated successfully.");
          setOpen(false);
          setDetail(null);
          fetchItems();
        } else {
          toast.error(data.message || "Failed to update promotion");
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
          id: values.Id,
          ...buildBasePayload(values),
          promotionCategoryLines: buildPromotionProductItemLinesPayload(prodRows),
        };
        const response = await fetch(`${BASE_URL}/ECommerce/UpdatePromotion`, {
          method: "POST",
          body: JSON.stringify(payload),
          headers,
        });
        const data = await response.json();
        if (isPromotionApiSuccess(data)) {
          toast.success(data.message || "Promotion updated successfully.");
          setOpen(false);
          setDetail(null);
          fetchItems();
        } else {
          toast.error(data.message || "Failed to update promotion");
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
            id: values.Id,
            ...buildBasePayload(values),
            promotionCategoryLines: null,
            promotionTotalAmountLines: null,
          };
          const response = await fetch(`${BASE_URL}/ECommerce/UpdatePromotion`, {
            method: "POST",
            body: JSON.stringify(payload),
            headers,
          });
          const data = await response.json();
          if (isPromotionApiSuccess(data)) {
            toast.success(data.message || "Promotion updated successfully.");
            setOpen(false);
            setDetail(null);
            fetchItems();
          } else {
            toast.error(data.message || "Failed to update promotion");
          }
          return;
        }
        const rows = getValidTotalAmountRows(values.PromotionTotalAmountLines);
        if (rows.length === 0) {
          toast.error("Add at least one tier with a positive max bill amount and discount.");
          return;
        }
        const payload = {
          id: values.Id,
          ...buildBasePayload(values),
          promotionCategoryLines: null,
          promotionTotalAmountLines: buildPromotionTotalAmountLinesPayload(rows),
        };
        const response = await fetch(`${BASE_URL}/ECommerce/UpdatePromotion`, {
          method: "POST",
          body: JSON.stringify(payload),
          headers,
        });
        const data = await response.json();
        if (isPromotionApiSuccess(data)) {
          toast.success(data.message || "Promotion updated successfully.");
          setOpen(false);
          setDetail(null);
          fetchItems();
        } else {
          toast.error(data.message || "Failed to update promotion");
        }
        return;
      }

      const payload = {
        id: values.Id,
        ...buildBasePayload(values),
        promotionCategoryLines: null,
      };
      const response = await fetch(`${BASE_URL}/ECommerce/UpdatePromotion`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers,
      });
      const data = await response.json();
      if (isPromotionApiSuccess(data)) {
        toast.success(data.message || "Promotion updated successfully.");
        setOpen(false);
        setDetail(null);
        fetchItems();
      } else {
        toast.error(data.message || "Failed to update promotion");
      }
    } catch (error) {
      toast.error(error.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
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
          {detailLoading && !detail ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress size={28} />
            </Box>
          ) : (
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
          )}
        </Box>
      </Modal>
    </>
  );
}

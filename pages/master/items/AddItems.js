import React, { useEffect, useMemo, useRef, useState } from "react";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useRouter } from "next/router";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ChartOfAccountType } from "@/components/types/types";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import AddCategory from "../category/AddCategory";
import AddSubCategory from "@/components/UIElements/Modal/AddSubCategory";
import AddSupplier from "../supplier/AddSupplier";
import AddUOM from "../uom/create";

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
  Name: Yup.string()
    .required("Item Name is required")
    .max(120, "Item Name must be at most 120 characters"),
  Code: Yup.string().required("Item Code is required"),
  CategoryId: Yup.number().required("Category is required"),
  SubCategoryId: Yup.number().required("Sub Category is required"),
  Supplier: Yup.number().required("Supplier is required"),
  UOM: Yup.number().required("Unit of Measure is required"),
  ReorderLevel: Yup.mixed()
    .nullable()
    .test(
      "reorder-non-negative",
      "Reorder Level cannot be negative",
      (val) => {
        if (val === null || val === undefined || val === "") return true;
        const n = Number(val);
        if (Number.isNaN(n)) return false;
        return n >= 0;
      }
    ),
});

/** Maps GetItemById entity to Add Item Formik shape (excludes Id, InternalId, audit fields). */
function mapApiItemToDuplicateFormValues(src) {
  if (!src) return null;
  const pick = (camel, pascal) => src[camel] ?? src[pascal];
  return {
    Name: pick("name", "Name") || "",
    Code: pick("code", "Code") || "",
    AveragePrice: pick("averagePrice", "AveragePrice") ?? null,
    WholesalePrice: pick("wholesalePrice", "WholesalePrice") ?? null,
    WholesaleMinimumQuantity:
      pick("wholesaleMinimumQuantity", "WholesaleMinimumQuantity") ?? null,
    ShipmentTarget: pick("shipmentTarget", "ShipmentTarget") ?? null,
    ReorderLevel: (() => {
      const r = pick("reorderLevel", "ReorderLevel");
      if (r == null || r === "") return null;
      const n = Number(r);
      return Number.isNaN(n) ? null : Math.max(0, n);
    })(),
    CategoryId: pick("categoryId", "CategoryId") ?? "",
    SubCategoryId: pick("subCategoryId", "SubCategoryId") ?? "",
    Supplier: pick("supplier", "Supplier") ?? "",
    UOM: pick("uom", "UOM") ?? "",
    CurrencyId: pick("currencyId", "CurrencyId") ?? "",
    Barcode: pick("barcode", "Barcode") ?? null,
    CostAccount: pick("costAccount", "CostAccount") ?? null,
    AssetsAccount: pick("assetsAccount", "AssetsAccount") ?? null,
    IncomeAccount: pick("incomeAccount", "IncomeAccount") ?? null,
    IsActive: pick("isActive", "IsActive") ?? true,
    IsNonInventoryItem: pick("isNonInventoryItem", "IsNonInventoryItem") ?? false,
    HasSerialNumbers: pick("hasSerialNumbers", "HasSerialNumbers") ?? false,
    IsWebView: pick("isWebView", "IsWebView") ?? false,
    IsOutOfStock: pick("isOutOfStock", "IsOutOfStock") ?? false,
    IsItemEndInvolve: pick("isItemEndInvolve", "IsItemEndInvolve") ?? false,
    Description: pick("description", "Description") || "",
  };
}

function getAddItemEmptyFormValues(code) {
  return {
    Name: "",
    Code: code ?? "",
    AveragePrice: null,
    WholesalePrice: null,
    WholesaleMinimumQuantity: null,
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
    IsOutOfStock: false,
    IsItemEndInvolve: false,
    Description: "",
  };
}

const DUPLICATE_FORM_BOOLEAN_KEYS = new Set([
  "IsActive",
  "IsNonInventoryItem",
  "HasSerialNumbers",
  "IsWebView",
  "IsOutOfStock",
  "IsItemEndInvolve",
]);

const DUPLICATE_FORM_NUMERIC_KEYS = new Set([
  "AveragePrice",
  "WholesalePrice",
  "WholesaleMinimumQuantity",
  "ShipmentTarget",
  "ReorderLevel",
  "CategoryId",
  "SubCategoryId",
  "Supplier",
  "UOM",
  "CurrencyId",
  "CostAccount",
  "AssetsAccount",
  "IncomeAccount",
]);

function normalizeItemFormValuesForDuplicateCompare(values) {
  if (!values) return null;
  const out = {};
  for (const key of Object.keys(values)) {
    let v = values[key];
    if (v === undefined || v === "") {
      v = null;
    } else if (DUPLICATE_FORM_BOOLEAN_KEYS.has(key)) {
      v = Boolean(v);
    } else if (typeof v === "string" && ["Name", "Code", "Description", "Barcode"].includes(key)) {
      v = v.trim();
      if (v === "") v = null;
    } else if (DUPLICATE_FORM_NUMERIC_KEYS.has(key) && v !== null) {
      const n = Number(v);
      if (!Number.isNaN(n)) v = n;
    }
    out[key] = v;
  }
  return out;
}

function sortedStringifyForDuplicateCompare(obj) {
  if (!obj) return "{}";
  const keys = Object.keys(obj).sort();
  const sorted = {};
  keys.forEach((k) => {
    sorted[k] = obj[k];
  });
  return JSON.stringify(sorted);
}

/** Returns true when current Formik values match the duplicate snapshot (no meaningful edits). */
function areDuplicateItemFormValuesUnchanged(current, snapshot) {
  if (!snapshot) return false;
  const keys = Object.keys(snapshot);
  const pick = (src) => {
    const o = {};
    keys.forEach((k) => {
      o[k] = src[k];
    });
    return o;
  };
  const a = normalizeItemFormValuesForDuplicateCompare(current);
  const b = normalizeItemFormValuesForDuplicateCompare(snapshot);
  return sortedStringifyForDuplicateCompare(pick(a)) === sortedStringifyForDuplicateCompare(pick(b));
}

export default function AddItems({
  fetchItems,
  isPOSSystem,
  uoms,
  isGarmentSystem,
  chartOfAccounts,
  barcodeEnabled,
  IsEcommerceWebSiteAvailable,
  subCategories = [],
  duplicateRequestSeq = 0,
}) {
  const router = useRouter();
  const { data: isItemEndInvolveEnable } = IsAppSettingEnabled("IsItemEndInvolveEnable");
  const [itemCode, setItemCode] = useState(null);
  const [duplicateSourceId, setDuplicateSourceId] = useState(null);
  const [duplicatePrefill, setDuplicatePrefill] = useState(null);
  const [initialDuplicateSnapshot, setInitialDuplicateSnapshot] = useState(null);
  const [duplicateSourceId, setDuplicateSourceId] = useState(null);
  const [duplicatePrefill, setDuplicatePrefill] = useState(null);
  const [initialDuplicateSnapshot, setInitialDuplicateSnapshot] = useState(null);
  const [open, setOpen] = React.useState(false);
  const handleClose = () => {
    setOpen(false);
    setSubImages((prev) => {
      prev.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
      return [];
    });
  };
  const handleClose = () => {
    setOpen(false);
    setSubImages((prev) => {
      prev.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
      return [];
    });
  };
  const [selectedCat, setSelectedCat] = useState();
  const [categoryList, setCategoryList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [currencyList, setCurrencyList] = useState([]);
  const inputRef = useRef(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [subImages, setSubImages] = useState([]); // { id, preview, file, price, description }
  const subImageInputRef = useRef(null);
  const [subImages, setSubImages] = useState([]); // { id, preview, file, price, description }
  const subImageInputRef = useRef(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createSubCategoryOpen, setCreateSubCategoryOpen] = useState(false);
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);
  const [createUOMOpen, setCreateUOMOpen] = useState(false);
  const [uomList, setUomList] = useState(uoms || []);

  const clearDuplicateContext = () => {
    localStorage.removeItem("duplicateItemId");
    setDuplicateSourceId(null);
    setDuplicatePrefill(null);
    setInitialDuplicateSnapshot(null);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("duplicateItemId");
    if (raw) {
      setDuplicateSourceId(raw);
    } else {
      setDuplicateSourceId(null);
      setDuplicatePrefill(null);
      setInitialDuplicateSnapshot(null);
    }
  }, [router.asPath, duplicateRequestSeq]);

  useEffect(() => {
    if (duplicatePrefill) {
      setOpen(true);
    }
  }, [duplicatePrefill]);

  const clearDuplicateContext = () => {
    localStorage.removeItem("duplicateItemId");
    setDuplicateSourceId(null);
    setDuplicatePrefill(null);
    setInitialDuplicateSnapshot(null);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("duplicateItemId");
    if (raw) {
      setDuplicateSourceId(raw);
    } else {
      setDuplicateSourceId(null);
      setDuplicatePrefill(null);
      setInitialDuplicateSnapshot(null);
    }
  }, [router.asPath, duplicateRequestSeq]);

  useEffect(() => {
    if (duplicatePrefill) {
      setOpen(true);
    }
  }, [duplicatePrefill]);

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
    // Manual "New item" should always start from a fresh form, not stale duplicate state.
    clearDuplicateContext();
    setSelectedCat(undefined);
    setSubCategoryList([]);
    // Manual "New item" should always start from a fresh form, not stale duplicate state.
    clearDuplicateContext();
    setSelectedCat(undefined);
    setSubCategoryList([]);
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
        (item) => item.categoryId == id
      );
      setSubCategoryList(filteredItems);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (!duplicateSourceId) return;

    const loadDuplicateItem = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Items/GetItemById?id=${duplicateSourceId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch item");
        }

        const data = await response.json();
        const src = data.result;
        const formValues = mapApiItemToDuplicateFormValues(src);
        if (!formValues) return;

        const categoryId = src.categoryId ?? src.CategoryId;
        if (categoryId) {
          setSelectedCat(categoryId);
          if (Array.isArray(subCategories) && subCategories.length > 0) {
            setSubCategoryList(
              subCategories.filter((sc) => sc.categoryId == categoryId)
            );
          } else {
            await fetchSubCategoryList(categoryId);
          }
        }

        setDuplicatePrefill(formValues);
        setInitialDuplicateSnapshot(
          typeof structuredClone === "function"
            ? structuredClone(formValues)
            : JSON.parse(JSON.stringify(formValues))
        );
        setItemCode(formValues.Code ?? "");
      } catch (error) {
        console.error("Error loading duplicate item:", error);
      }
    };

    loadDuplicateItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchSubCategoryList / subCategories from parent; intentional deps below
  }, [duplicateSourceId, duplicateRequestSeq]);


  useEffect(() => {
    if (!duplicateSourceId) return;

    const loadDuplicateItem = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Items/GetItemById?id=${duplicateSourceId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch item");
        }

        const data = await response.json();
        const src = data.result;
        const formValues = mapApiItemToDuplicateFormValues(src);
        if (!formValues) return;

        const categoryId = src.categoryId ?? src.CategoryId;
        if (categoryId) {
          setSelectedCat(categoryId);
          if (Array.isArray(subCategories) && subCategories.length > 0) {
            setSubCategoryList(
              subCategories.filter((sc) => sc.categoryId == categoryId)
            );
          } else {
            await fetchSubCategoryList(categoryId);
          }
        }

        setDuplicatePrefill(formValues);
        setInitialDuplicateSnapshot(
          typeof structuredClone === "function"
            ? structuredClone(formValues)
            : JSON.parse(JSON.stringify(formValues))
        );
        setItemCode(formValues.Code ?? "");
      } catch (error) {
        console.error("Error loading duplicate item:", error);
      }
    };

    loadDuplicateItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchSubCategoryList / subCategories from parent; intentional deps below
  }, [duplicateSourceId, duplicateRequestSeq]);

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

  const formInitialValues = useMemo(
    () => duplicatePrefill ?? getAddItemEmptyFormValues(itemCode),
    [duplicatePrefill, itemCode]
  );

  const formInitialValues = useMemo(
    () => duplicatePrefill ?? getAddItemEmptyFormValues(itemCode),
    [duplicatePrefill, itemCode]
  );

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
    if (typeof window !== "undefined" && window.currentSetFieldValue) {
      window.currentSetFieldValue("IsWebView", false);
    }
  };

  const handleSubImagesUpload = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const newSubImages = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      const id = `${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`;
      newSubImages.push({
        id,
        preview: URL.createObjectURL(file),
        file,
        price: "",
        description: "",
        isOutOfStock: false,
      });
    }
    setSubImages((prev) => [...prev, ...newSubImages]);
    event.target.value = "";
  };

  const updateSubImageMeta = (id, field, value) => {
    setSubImages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeSubImage = (id) => {
    setSubImages((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item && item.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleCategoryCreated = async (setFieldValue, createdId) => {
    await fetchCategoryList();
    if (createdId == null || createdId === "" || !setFieldValue) return;
    setFieldValue("CategoryId", createdId);
    setSelectedCat(createdId);
    setFieldValue("SubCategoryId", "");
    await fetchSubCategoryList(createdId);
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
    if (values.IsWebView && !selectedFile) {
      toast.warning("Please upload an item image before enabling Show in web.");
      return;
    }
    if (values.IsWebView && values.AveragePrice === null) {
      toast.warning("Please enter the average price for web view.");
      return;
    }
    const wp =
      values.WholesalePrice !== null && values.WholesalePrice !== ""
        ? Number(values.WholesalePrice)
        : NaN;
    const wq =
      values.WholesaleMinimumQuantity !== null && values.WholesaleMinimumQuantity !== ""
        ? Number(values.WholesaleMinimumQuantity)
        : NaN;
    if (Number.isFinite(wp) && wp > 0) {
      if (!Number.isFinite(wq) || wq <= 0) {
        toast.warning("Enter wholesale minimum quantity when wholesale price is set.");
        return;
      }
    }
    if (Number.isFinite(wq) && wq > 0) {
      if (!Number.isFinite(wp) || wp <= 0) {
        toast.warning("Enter wholesale price when wholesale minimum quantity is set.");
        return;
      }
    }
    if (
      initialDuplicateSnapshot &&
      areDuplicateItemFormValuesUnchanged(values, initialDuplicateSnapshot)
    ) {
      toast.warning("Please modify at least one field before creating a duplicate item.");
      return;
    }
    const wp =
      values.WholesalePrice !== null && values.WholesalePrice !== ""
        ? Number(values.WholesalePrice)
        : NaN;
    const wq =
      values.WholesaleMinimumQuantity !== null && values.WholesaleMinimumQuantity !== ""
        ? Number(values.WholesaleMinimumQuantity)
        : NaN;
    if (Number.isFinite(wp) && wp > 0) {
      if (!Number.isFinite(wq) || wq <= 0) {
        toast.warning("Enter wholesale minimum quantity when wholesale price is set.");
        return;
      }
    }
    if (Number.isFinite(wq) && wq > 0) {
      if (!Number.isFinite(wp) || wp <= 0) {
        toast.warning("Enter wholesale price when wholesale minimum quantity is set.");
        return;
      }
    }
    if (
      initialDuplicateSnapshot &&
      areDuplicateItemFormValuesUnchanged(values, initialDuplicateSnapshot)
    ) {
      toast.warning("Please modify at least one field before creating a duplicate item.");
      return;
    }
    const formData = new FormData();

    formData.append("Name", values.Name);
    formData.append("Code", values.Code);
    formData.append("AveragePrice", values.AveragePrice);
    formData.append(
      "WholesalePrice",
      values.WholesalePrice !== null && values.WholesalePrice !== "" ? values.WholesalePrice : "",
    );
    formData.append(
      "WholesaleMinimumQuantity",
      values.WholesaleMinimumQuantity !== null && values.WholesaleMinimumQuantity !== ""
        ? values.WholesaleMinimumQuantity
        : "",
    );
    formData.append(
      "WholesalePrice",
      values.WholesalePrice !== null && values.WholesalePrice !== "" ? values.WholesalePrice : "",
    );
    formData.append(
      "WholesaleMinimumQuantity",
      values.WholesaleMinimumQuantity !== null && values.WholesaleMinimumQuantity !== ""
        ? values.WholesaleMinimumQuantity
        : "",
    );
    formData.append("ShipmentTarget", values.ShipmentTarget ? values.ShipmentTarget : "");
    {
      const rl = values.ReorderLevel;
      const rlNum =
        rl != null && rl !== "" ? Math.max(0, Number(rl)) : null;
      formData.append(
        "ReorderLevel",
        rlNum != null && !Number.isNaN(rlNum) ? String(rlNum) : ""
      );
    }
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
    formData.append("IsOutOfStock", values.IsOutOfStock);
    formData.append("IsItemEndInvolve", values.IsItemEndInvolve);
    formData.append("IsOutOfStock", values.IsOutOfStock);
    formData.append("IsItemEndInvolve", values.IsItemEndInvolve);
    formData.append("ProductImage", selectedFile ? selectedFile : null);
    (subImages || []).forEach((item) => {
      if (item.file) formData.append("SubImages", item.file);
    });
    const subImagesMeta = (subImages || [])
      .filter((item) => item.file)
      .map((item) => {
        const priceVal = item.price !== "" && item.price != null ? parseFloat(item.price) : NaN;
        return {
          price: !isNaN(priceVal) ? priceVal : null,
          description: item.description?.trim() || null,
          isOutOfStock: !!item.isOutOfStock,
        };
      });
    formData.append("SubImagesMeta", JSON.stringify(subImagesMeta));
    (subImages || []).forEach((item) => {
      if (item.file) formData.append("SubImages", item.file);
    });
    const subImagesMeta = (subImages || [])
      .filter((item) => item.file)
      .map((item) => {
        const priceVal = item.price !== "" && item.price != null ? parseFloat(item.price) : NaN;
        return {
          price: !isNaN(priceVal) ? priceVal : null,
          description: item.description?.trim() || null,
          isOutOfStock: !!item.isOutOfStock,
        };
      });
    formData.append("SubImagesMeta", JSON.stringify(subImagesMeta));
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
          clearDuplicateContext();
          clearDuplicateContext();
          setOpen(false);
          setSubImages((prev) => {
            prev.forEach((item) => {
              if (item.preview) URL.revokeObjectURL(item.preview);
            });
            return [];
          });
          setSubImages((prev) => {
            prev.forEach((item) => {
              if (item.preview) URL.revokeObjectURL(item.preview);
            });
            return [];
          });
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
        + New Item
        + New Item
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            enableReinitialize
            initialValues={formInitialValues}
            enableReinitialize
            initialValues={formInitialValues}
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
                      {duplicatePrefill ? "Duplicate Item" : "Add Item"}
                      {duplicatePrefill ? "Duplicate Item" : "Add Item"}
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
                            inputProps={{ maxLength: 120 }}
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
                        {IsEcommerceWebSiteAvailable && (
                        {IsEcommerceWebSiteAvailable && (
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
                            <Grid item xs={12} mt={1} lg={6}>
                              <Typography
                                sx={{
                                  fontWeight: "500",
                                  fontSize: "14px",
                                  mb: "5px",
                                }}
                              >
                                Wholesale price
                              </Typography>
                              <Field
                                as={TextField}
                                fullWidth
                                name="WholesalePrice"
                                size="small"
                                type="number"
                                inputProps={{ min: 0, step: "any" }}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFieldValue("WholesalePrice", value === "" ? null : value);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} mt={1} lg={6}>
                              <Typography
                                sx={{
                                  fontWeight: "500",
                                  fontSize: "14px",
                                  mb: "5px",
                                }}
                              >
                                Wholesale minimum quantity
                              </Typography>
                              <Field
                                as={TextField}
                                fullWidth
                                name="WholesaleMinimumQuantity"
                                size="small"
                                type="number"
                                inputProps={{ min: 0, step: "any" }}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFieldValue("WholesaleMinimumQuantity", value === "" ? null : value);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} mt={1} lg={6}>
                              <Typography
                                sx={{
                                  fontWeight: "500",
                                  fontSize: "14px",
                                  mb: "5px",
                                }}
                              >
                                Wholesale price
                              </Typography>
                              <Field
                                as={TextField}
                                fullWidth
                                name="WholesalePrice"
                                size="small"
                                type="number"
                                inputProps={{ min: 0, step: "any" }}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFieldValue("WholesalePrice", value === "" ? null : value);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} mt={1} lg={6}>
                              <Typography
                                sx={{
                                  fontWeight: "500",
                                  fontSize: "14px",
                                  mb: "5px",
                                }}
                              >
                                Wholesale minimum quantity
                              </Typography>
                              <Field
                                as={TextField}
                                fullWidth
                                name="WholesaleMinimumQuantity"
                                size="small"
                                type="number"
                                inputProps={{ min: 0, step: "any" }}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFieldValue("WholesaleMinimumQuantity", value === "" ? null : value);
                                }}
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
                            inputProps={{ min: 0, step: 1 }}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                setFieldValue("ReorderLevel", null);
                                return;
                              }
                              const n = Number(value);
                              if (!Number.isNaN(n)) {
                                setFieldValue("ReorderLevel", Math.max(0, n));
                              }
                            }}
                            error={touched.ReorderLevel && Boolean(errors.ReorderLevel)}
                            helperText={touched.ReorderLevel && errors.ReorderLevel}
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
                                  disabled={!selectedFile && !values.IsWebView}
                                  control={
                                    <Field
                                      as={Checkbox}
                                      name="IsWebView"
                                      checked={values.IsWebView}
                                      disabled={!selectedFile && !values.IsWebView}
                                      onChange={() => {
                                        if (!values.IsWebView && !selectedFile) {
                                          toast.warning(
                                            "Please upload an item image before enabling Show in web."
                                          );
                                          return;
                                        }
                                        setFieldValue("IsWebView", !values.IsWebView);
                                      }}
                                    />
                                  }
                                  label="Show in web"
                                />
                              </Grid>
                            )}

                            {isItemEndInvolveEnable && (
                              <Grid item xs={12} lg={6} mt={1}>
                                <FormControlLabel
                                  control={
                                    <Field
                                      as={Checkbox}
                                      name="IsItemEndInvolve"
                                      checked={values.IsItemEndInvolve}
                                      onChange={() => setFieldValue("IsItemEndInvolve", !values.IsItemEndInvolve)}
                                    />
                                  }
                                  label="Is Item End Involve"
                                />
                              </Grid>
                            )}

                            {isItemEndInvolveEnable && (
                              <Grid item xs={12} lg={6} mt={1}>
                                <FormControlLabel
                                  control={
                                    <Field
                                      as={Checkbox}
                                      name="IsItemEndInvolve"
                                      checked={values.IsItemEndInvolve}
                                      onChange={() => setFieldValue("IsItemEndInvolve", !values.IsItemEndInvolve)}
                                    />
                                  }
                                  label="Is Item End Involve"
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
                            {IsEcommerceWebSiteAvailable && (
                              <FormControlLabel
                                sx={{ mt: 1, display: "block" }}
                                control={
                                  <Field
                                    as={Checkbox}
                                    name="IsOutOfStock"
                                    checked={values.IsOutOfStock}
                                    onChange={() => setFieldValue("IsOutOfStock", !values.IsOutOfStock)}
                                  />
                                }
                                label="Out of Stock (main image)"
                              />
                            )}
                            {IsEcommerceWebSiteAvailable && (
                              <FormControlLabel
                                sx={{ mt: 1, display: "block" }}
                                control={
                                  <Field
                                    as={Checkbox}
                                    name="IsOutOfStock"
                                    checked={values.IsOutOfStock}
                                    onChange={() => setFieldValue("IsOutOfStock", !values.IsOutOfStock)}
                                  />
                                }
                                label="Out of Stock (main image)"
                              />
                            )}
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
                              {IsEcommerceWebSiteAvailable && (
                                <FormControlLabel
                                  sx={{ mt: 2, justifyContent: "center" }}
                                  control={
                                    <Field
                                      as={Checkbox}
                                      name="IsOutOfStock"
                                      checked={values.IsOutOfStock}
                                      onChange={() => setFieldValue("IsOutOfStock", !values.IsOutOfStock)}
                                    />
                                  }
                                  label="Out of Stock (main image)"
                                />
                              )}
                              {IsEcommerceWebSiteAvailable && (
                                <FormControlLabel
                                  sx={{ mt: 2, justifyContent: "center" }}
                                  control={
                                    <Field
                                      as={Checkbox}
                                      name="IsOutOfStock"
                                      checked={values.IsOutOfStock}
                                      onChange={() => setFieldValue("IsOutOfStock", !values.IsOutOfStock)}
                                    />
                                  }
                                  label="Out of Stock (main image)"
                                />
                              )}
                            </Box>
                          </Grid>
                        )}

                        {/* Sub Images section */}
                        <Grid item xs={12} sx={{ mt: 3 }}>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Sub Images
                          </Typography>
                          <Button
                            variant="contained"
                            component="label"
                            startIcon={<CloudUploadIcon />}
                            sx={{ mb: 2 }}
                          >
                            Choose Image
                            <input
                              ref={subImageInputRef}
                              type="file"
                              hidden
                              accept="image/*"
                              multiple
                              onChange={handleSubImagesUpload}
                            />
                          </Button>
                          {subImages.length > 0 ? (
                            <Grid container spacing={2}>
                              {subImages.map((item) => (
                                <Grid item xs={12} sm={6} md={4} key={item.id}>
                                  <Box
                                    sx={{
                                      position: "relative",
                                      border: "2px solid #e0e0e0",
                                      borderRadius: "8px",
                                      overflow: "hidden",
                                      "&:hover .delete-icon": {
                                        opacity: 1,
                                      },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        height: "140px",
                                        position: "relative",
                                        backgroundColor: "#f5f5f5",
                                      }}
                                    >
                                      <img
                                        src={item.preview}
                                        alt="Sub"
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                      <IconButton
                                        className="delete-icon"
                                        onClick={() => removeSubImage(item.id)}
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
                                    <Box sx={{ p: 1.5 }}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Price"
                                        type="number"
                                        inputProps={{ min: 0, step: 0.01 }}
                                        value={item.price ?? ""}
                                        onChange={(e) =>
                                          updateSubImageMeta(item.id, "price", e.target.value)
                                        }
                                        sx={{ mb: 1 }}
                                      />
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Description"
                                        multiline
                                        rows={2}
                                        value={item.description ?? ""}
                                        onChange={(e) =>
                                          updateSubImageMeta(item.id, "description", e.target.value)
                                        }
                                      />
                                      {IsEcommerceWebSiteAvailable && (
                                        <FormControlLabel
                                          sx={{ mt: 0.5, alignItems: "flex-start", ml: 0 }}
                                          control={
                                            <Checkbox
                                              size="small"
                                              checked={!!item.isOutOfStock}
                                              onChange={(e) =>
                                                updateSubImageMeta(item.id, "isOutOfStock", e.target.checked)
                                              }
                                            />
                                          }
                                          label="Out of Stock"
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          ) : (
                            <Box
                              sx={{
                                border: "2px dashed #ccc",
                                borderRadius: "8px",
                                p: 3,
                                textAlign: "center",
                                backgroundColor: "#f9f9f9",
                              }}
                            >
                              <CloudUploadIcon sx={{ fontSize: 48, color: "#999", mb: 1 }} />
                              <Typography variant="body2" color="textSecondary">
                                No sub images. Click "Choose Image" to add multiple images.
                              </Typography>
                            </Box>
                          )}
                        </Grid>

                        {/* Sub Images section */}
                        <Grid item xs={12} sx={{ mt: 3 }}>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Sub Images
                          </Typography>
                          <Button
                            variant="contained"
                            component="label"
                            startIcon={<CloudUploadIcon />}
                            sx={{ mb: 2 }}
                          >
                            Choose Image
                            <input
                              ref={subImageInputRef}
                              type="file"
                              hidden
                              accept="image/*"
                              multiple
                              onChange={handleSubImagesUpload}
                            />
                          </Button>
                          {subImages.length > 0 ? (
                            <Grid container spacing={2}>
                              {subImages.map((item) => (
                                <Grid item xs={12} sm={6} md={4} key={item.id}>
                                  <Box
                                    sx={{
                                      position: "relative",
                                      border: "2px solid #e0e0e0",
                                      borderRadius: "8px",
                                      overflow: "hidden",
                                      "&:hover .delete-icon": {
                                        opacity: 1,
                                      },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        height: "140px",
                                        position: "relative",
                                        backgroundColor: "#f5f5f5",
                                      }}
                                    >
                                      <img
                                        src={item.preview}
                                        alt="Sub"
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                      <IconButton
                                        className="delete-icon"
                                        onClick={() => removeSubImage(item.id)}
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
                                    <Box sx={{ p: 1.5 }}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Price"
                                        type="number"
                                        inputProps={{ min: 0, step: 0.01 }}
                                        value={item.price ?? ""}
                                        onChange={(e) =>
                                          updateSubImageMeta(item.id, "price", e.target.value)
                                        }
                                        sx={{ mb: 1 }}
                                      />
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Description"
                                        multiline
                                        rows={2}
                                        value={item.description ?? ""}
                                        onChange={(e) =>
                                          updateSubImageMeta(item.id, "description", e.target.value)
                                        }
                                      />
                                      {IsEcommerceWebSiteAvailable && (
                                        <FormControlLabel
                                          sx={{ mt: 0.5, alignItems: "flex-start", ml: 0 }}
                                          control={
                                            <Checkbox
                                              size="small"
                                              checked={!!item.isOutOfStock}
                                              onChange={(e) =>
                                                updateSubImageMeta(item.id, "isOutOfStock", e.target.checked)
                                              }
                                            />
                                          }
                                          label="Out of Stock"
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          ) : (
                            <Box
                              sx={{
                                border: "2px dashed #ccc",
                                borderRadius: "8px",
                                p: 3,
                                textAlign: "center",
                                backgroundColor: "#f9f9f9",
                              }}
                            >
                              <CloudUploadIcon sx={{ fontSize: 48, color: "#999", mb: 1 }} />
                              <Typography variant="body2" color="textSecondary">
                                No sub images. Click "Choose Image" to add multiple images.
                              </Typography>
                            </Box>
                          )}
                        </Grid>
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

      {/* Category create: same form as /master/category (AddCategory) */}
      <AddCategory
        hideButton
        open={createCategoryOpen}
        onClose={() => setCreateCategoryOpen(false)}
        fetchItems={(createdId) =>
          handleCategoryCreated(window.currentSetFieldValue, createdId)
        }
        IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable}
      />

      {/* Sub category create: same form as /master/sub-category (AddSubCategory) */}
      <AddSubCategory
        hideButton
        open={createSubCategoryOpen}
        onClose={() => setCreateSubCategoryOpen(false)}
        initialCategoryId={selectedCat}
        fetchItems={(createdId) =>
          handleSubCategoryCreated(window.currentSetFieldValue, createdId)
        }
        IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable}
      />

      {/* Supplier create: same form as /master/supplier (AddSupplier) */}
      <AddSupplier
        hideButton
        open={createSupplierOpen}
        onClose={() => setCreateSupplierOpen(false)}
        fetchItems={(createdId) =>
          handleSupplierCreated(window.currentSetFieldValue, createdId)
        }
        isPOSSystem={isPOSSystem}
        banks={[]}
        isBankRequired={false}
        chartOfAccounts={chartOfAccounts}
      />

      {/* UOM create: same form as /master/uom (AddUOM) */}
      <AddUOM
        hideButton
        open={createUOMOpen}
        onClose={() => setCreateUOMOpen(false)}
        fetchItems={(createdId) =>
          handleUOMCreated(window.currentSetFieldValue, createdId)
        }
      />
    </>
  );
}

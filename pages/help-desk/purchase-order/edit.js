import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
  Button,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import useApi from "@/components/utils/useApi";
import { formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import IsFiscalPeriodAvailable from "@/components/utils/IsFiscalPeriodAvailable";
import PurchasingOrderType, { PurchasingOrderTypeLabels } from "@/components/utils/enums/PurchasingOrderType";

const HelpDeskPOEdit = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [referenceNo, setReferenceNo] = useState("");
  const [poDate, setPODate] = useState("");
  const [remark, setRemark] = useState("");
  const [grnNo, setGrnNo] = useState("");
  const [poNo, setPONo] = useState("");
  const [poType, setPOType] = useState("");
  const [poData, setPoData] = useState(null);
  const { data: isFiscalPeriodAvailable } = IsFiscalPeriodAvailable();

  useEffect(() => {
    sessionStorage.setItem("category", "18"); // Purchase Order category
  }, []);

  const navigateToBack = () => {
    router.push({
      pathname: "/help-desk/purchase-order",
    });
  };

  // Fetch suppliers from master data (Supplier/GetAll)
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Supplier/GetAll?SkipCount=0&MaxResultCount=10000&Search=null`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          // Handle paginated response structure
          if (result.result && result.result.items) {
            setSuppliers(result.result.items);
          } else if (Array.isArray(result.result)) {
            setSuppliers(result.result);
          } else if (Array.isArray(result)) {
            setSuppliers(result);
          }
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (id) {
      fetchPurchaseOrder();
    }
  }, [id]);

  // Set supplier when both suppliers and PO data are available
  useEffect(() => {
    if (poData && suppliers.length > 0 && poData.supplierId) {
      const foundSupplier = suppliers.find(s => s.id === poData.supplierId);
      if (foundSupplier) {
        setSupplier(foundSupplier);
      }
    }
  }, [poData, suppliers]);

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/HelpDesk/GetPurchaseOrderById?id=${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.result && data.result.result) {
          const po = data.result.result;
          setPONo(po.poNo);
          setPODate(formatDate(po.poDate));
          setGrnNo(po.grnNo || "");
          setReferenceNo(po.referenceNo || "");
          setRemark(po.remark || "");
          setPOType(po.purchasingOrderType?.toString() || "");
          setPoData(po); // Store PO data for supplier lookup
        }
      }
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      toast.error("Failed to load purchase order");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!supplier) {
      toast.error("Please select a supplier");
      return;
    }

    if (!poDate) {
      toast.error("Please select PO Date");
      return;
    }

    if (!isFiscalPeriodAvailable) {
      toast.warning("Please Start Fiscal Period First");
      return;
    }

    const data = {
      Id: parseInt(id),
      PODate: poDate,
      GRNNo: grnNo || null,
      SupplierId: supplier.id,
      ReferenceNo: referenceNo || null,
      Remark: remark || null,
      PurchasingOrderType: poType ? parseInt(poType) : null,
    };

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/HelpDesk/UpdatePurchaseOrder`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.result && jsonResponse.result.statusCode === 1) {
          toast.success(
            jsonResponse.result.message || "Purchase Order updated successfully"
          );
          setTimeout(() => {
            router.push("/help-desk/purchase-order");
          }, 1500);
        } else {
          toast.error(
            jsonResponse.result?.message || "Failed to update Purchase Order"
          );
        }
      } else {
        toast.error("Failed to update Purchase Order");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while updating Purchase Order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Edit Purchase Order</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>
            <Link href="/help-desk/help-desk">Help Desk</Link>
          </li>
          <li>
            <Link href="/help-desk/purchase-order">Purchase Order</Link>
          </li>
          <li>Edit</li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={3} spacing={2}>
            <Grid item gap={2} xs={12} display="flex" justifyContent="space-between" alignItems="center">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>
                  PO No: {poNo}
                </Typography>
              </Button>
              <Button variant="outlined" onClick={() => navigateToBack()}>
                <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
              </Button>
            </Grid>

            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  width: "35%",
                }}
              >
                PO Date <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={poDate}
                onChange={(e) => setPODate(e.target.value)}
                required
              />
            </Grid>

            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  width: "35%",
                }}
              >
                Supplier <span style={{ color: "red" }}>*</span>
              </Typography>
              <Autocomplete
                sx={{ width: "60%" }}
                options={suppliers}
                getOptionLabel={(option) => option.name || ""}
                value={supplier}
                onChange={(event, newValue) => setSupplier(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    fullWidth
                    placeholder="Search Supplier"
                    required
                  />
                )}
              />
            </Grid>

            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  width: "35%",
                }}
              >
                Reference No
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Enter Reference No"
              />
            </Grid>

            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  width: "35%",
                }}
              >
                PO Type <span style={{ color: "red" }}>*</span>
              </Typography>
              <Select
                sx={{ width: "60%" }}
                size="small"
                value={poType}
                onChange={(e) => setPOType(e.target.value)}
                displayEmpty
                required
              >
                <MenuItem value="" disabled>
                  Select PO Type
                </MenuItem>
                <MenuItem value={PurchasingOrderType.Local}>
                  {PurchasingOrderTypeLabels[PurchasingOrderType.Local]}
                </MenuItem>
                <MenuItem value={PurchasingOrderType.Import}>
                  {PurchasingOrderTypeLabels[PurchasingOrderType.Import]}
                </MenuItem>
              </Select>
            </Grid>

            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  width: "35%",
                }}
              >
                GRN No
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={grnNo}
                onChange={(e) => setGrnNo(e.target.value)}
                placeholder="Enter GRN No"
              />
            </Grid>

            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  width: "35%",
                }}
              >
                Remark
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                multiline
                rows={3}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter Remark"
              />
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="end" gap={2} mt={2}>
              <Button variant="outlined" onClick={() => navigateToBack()}>
                Cancel
              </Button>
              <LoadingButton
                variant="contained"
                onClick={handleSubmit}
                loading={isSubmitting}
              >
                Update Purchase Order
              </LoadingButton>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default HelpDeskPOEdit;


import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import useApi from "@/components/utils/useApi";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import SearchItemByName from "@/components/utils/SearchItemByName";
import GetAllSalesPersons from "@/components/utils/GetAllSalesPerson";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddCustomerDialog from "@/pages/master/customers/create";

const goBackButtonSx = {
  textTransform: "uppercase",
  fontWeight: 700,
  fontSize: "13px",
  letterSpacing: "0.08em",
  borderWidth: "1.5px",
  borderColor: "#7b68ee",
  color: "#7b68ee",
  px: 2.75,
  py: 0.85,
  borderRadius: "6px",
  lineHeight: 1.2,
  "&:hover": {
    borderColor: "#6357c9",
    color: "#6357c9",
    bgcolor: "rgba(123, 104, 238, 0.08)",
  },
};

const CreateSalesQuotation = () => {
  const today = new Date();
  const router = useRouter();
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { create, update } = IsPermissionEnabled(cId);
  const editIdParam = router.query?.id;
  const editId = Array.isArray(editIdParam) ? editIdParam[0] : editIdParam;
  const isEditMode = Boolean(editId);
  const canUsePage = isEditMode ? update : create;

  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [quotationDate, setQuotationDate] = useState(formatDate(today));
  const [quotationNo, setQuotationNo] = useState("");
  const [remark, setRemark] = useState("");
  const [salesPerson, setSalesPerson] = useState(null);

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [address4, setAddress4] = useState("");

  const [selectedRows, setSelectedRows] = useState([]);
  const [grossTotal, setGrossTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingQuotation, setLoadingQuotation] = useState(false);
  const [loadedQuotation, setLoadedQuotation] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);

  const searchRef = useRef(null);
  const qtyRefs = useRef([]);

  const { data: customerList } = useApi("/Customer/GetAllCustomer");
  const { data: accountList } = useApi("/ChartOfAccount/GetAll");
  const { data: salesPersonList } = GetAllSalesPersons();

  useEffect(() => {
    if (Array.isArray(customerList)) {
      setCustomers(customerList);
    } else if (customerList?.result && Array.isArray(customerList.result)) {
      setCustomers(customerList.result);
    }
  }, [customerList]);

  useEffect(() => {
    if (!accountList) return;
    const list = Array.isArray(accountList)
      ? accountList
      : accountList?.result ?? accountList?.items ?? [];
    setChartOfAccounts(Array.isArray(list) ? list : []);
  }, [accountList]);

  const fetchCustomersAfterCreate = async (newCustomer) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Customer/GetAllCustomer`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();
      const customersData = Array.isArray(data) ? data : data?.result || [];
      setCustomers(customersData);

      if (newCustomer) {
        const cid = newCustomer.id ?? newCustomer.Id;
        const found =
          customersData.find((c) => c.id === cid || c.Id === cid) || newCustomer;
        setCustomer(found);
        setAddress1(
          found.addressLine1 || found.AddressLine1 || ""
        );
        setAddress2(
          found.addressLine2 || found.AddressLine2 || ""
        );
        setAddress3(
          found.addressLine3 || found.AddressLine3 || ""
        );
        setAddress4(
          found.addressLine4 || found.AddressLine4 || ""
        );
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to refresh customer list");
    }
  };

  useEffect(() => {
    const sum = selectedRows.reduce(
      (total, row) => total + (Number(row.lineTotal) || 0),
      0
    );
    setGrossTotal(sum.toFixed(2));
  }, [selectedRows]);

  const updateQuotationNo = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=62`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setQuotationNo(result.result ?? "");
    } catch (err) {
      console.error("Error fetching next quotation number:", err);
      toast.error("Could not load quotation number. Check document sequence for Sales Quotation.");
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (editId) return;
    updateQuotationNo();
  }, [router.isReady, editId]);

  useEffect(() => {
    if (!router.isReady || !editId) {
      if (router.isReady && !editId) {
        setLoadedQuotation(null);
      }
      return;
    }

    let cancelled = false;
    setLoadingQuotation(true);
    setLoadedQuotation(null);

    (async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${BASE_URL}/SalesQuotation/GetSalesQuotationById?id=${editId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok || data.statusCode !== 200 || !data.result) {
          toast.error(data.message || "Quotation not found.");
          router.replace("/sales/sales-quotation");
          return;
        }

        const q = data.result;
        setQuotationNo(q.documentNo || "");
        setQuotationDate(formatDate(q.documentDate || new Date()));
        setRemark(q.remark || "");
        setAddress1(q.billToline1 || "");
        setAddress2(q.billToline2 || "");
        setAddress3(q.billToline3 || "");
        setAddress4(q.billToline4 || "");

        const rawLines = q.salesQuotationLines || q.SalesQuotationLines || [];
        const lineRows = rawLines
          .map((l) => ({
            productId: l.productId ?? l.ProductId,
            productCode: l.productCode || l.ProductCode || "",
            productName: l.productName || l.ProductName || "",
            qty: l.qty ?? l.Qty,
            sellingPrice: Number(l.sellingPrice ?? l.SellingPrice ?? 0),
            lineTotal:
              Number(l.lineTotal ?? l.LineTotal) ||
              Number(l.qty ?? l.Qty) * Number(l.sellingPrice ?? l.SellingPrice ?? 0),
            sequanceNo: l.sequanceNo ?? l.SequanceNo ?? 0,
          }))
          .sort((a, b) => (a.sequanceNo || 0) - (b.sequanceNo || 0));
        setSelectedRows(lineRows);
        setLoadedQuotation(q);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          toast.error("Failed to load quotation.");
          router.replace("/sales/sales-quotation");
        }
      } finally {
        if (!cancelled) setLoadingQuotation(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, editId]);

  useEffect(() => {
    if (!loadedQuotation) return;
    const q = loadedQuotation;
    const list = Array.isArray(customerList)
      ? customerList
      : customerList?.result;
    if (!Array.isArray(list)) return;

    const cid = q.customerID ?? q.customerId ?? q.CustomerID;
    const cust =
      list.find((c) => c.id === cid) ||
      list.find((c) => c.Id === cid) ||
      {
        id: cid,
        firstName: q.customerName || q.CustomerName || "",
        code: q.customerCode || q.CustomerCode || "",
      };
    setCustomer(cust);
  }, [loadedQuotation, customerList]);

  useEffect(() => {
    if (!loadedQuotation) return;
    const q = loadedQuotation;
    const spList = salesPersonList || [];
    if (!Array.isArray(spList)) return;
    const spid = q.salesPersonId ?? q.SalesPersonId;
    const sp = spList.find((s) => (s.id ?? s.Id) === spid);
    setSalesPerson(sp || null);
  }, [loadedQuotation, salesPersonList]);

  const navigateToBack = () => {
    router.push({ pathname: "/sales/sales-quotation" });
  };

  const handleAddItem = (item) => {
    if (!customer) {
      toast.error("Please select a customer first.");
      return;
    }
    if (!item) {
      return;
    }

    const exists = selectedRows.find((row) => row.productId === item.id);
    if (exists) {
      toast.warning(`${item.name} is already added. Update its quantity instead.`);
      return;
    }

    const sellingPrice = Number(item.sellingPrice ?? item.unitPrice ?? 0);
    const newRow = {
      productId: item.id,
      productCode: item.code || "",
      productName: item.name || "",
      qty: 1,
      sellingPrice,
      lineTotal: sellingPrice,
    };

    setSelectedRows((prev) => {
      const updated = [...prev, newRow];
      setTimeout(() => {
        const lastIndex = updated.length - 1;
        if (qtyRefs.current[lastIndex]) {
          qtyRefs.current[lastIndex].focus();
          qtyRefs.current[lastIndex].select?.();
        }
      }, 0);
      return updated;
    });
  };

  const handleQtyChange = (index, value) => {
    setSelectedRows((prev) => {
      const next = [...prev];
      const qty = value === "" ? "" : Number(value);
      next[index] = {
        ...next[index],
        qty,
        lineTotal:
          (Number(qty) || 0) * (Number(next[index].sellingPrice) || 0),
      };
      return next;
    });
  };

  const handlePriceChange = (index, value) => {
    setSelectedRows((prev) => {
      const next = [...prev];
      const price = value === "" ? "" : Number(value);
      next[index] = {
        ...next[index],
        sellingPrice: price,
        lineTotal:
          (Number(next[index].qty) || 0) * (Number(price) || 0),
      };
      return next;
    });
  };

  const handleDeleteRow = (index) => {
    setSelectedRows((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleQtyRef = (el, index) => {
    qtyRefs.current[index] = el;
  };

  const validate = () => {
    if (!customer) {
      toast.error("Please select a customer.");
      return false;
    }
    if (!quotationDate) {
      toast.error("Please select a quotation date.");
      return false;
    }
    if (selectedRows.length === 0) {
      toast.error("Please add at least one item.");
      return false;
    }

    for (let i = 0; i < selectedRows.length; i++) {
      const row = selectedRows[i];
      const qty = Number(row.qty);
      const price = Number(row.sellingPrice);
      if (!qty || qty <= 0) {
        toast.error(`Quantity for "${row.productName}" must be greater than 0.`);
        return false;
      }
      if (price < 0 || Number.isNaN(price)) {
        toast.error(`Selling price for "${row.productName}" is invalid.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    const lines = selectedRows.map((row, idx) => ({
      productId: row.productId,
      productCode: row.productCode,
      productName: row.productName,
      qty: Number(row.qty),
      sellingPrice: Number(row.sellingPrice),
      lineTotal: Number(row.qty) * Number(row.sellingPrice),
      sequanceNo: idx + 1,
    }));

    const totalGross = lines.reduce((acc, l) => acc + l.lineTotal, 0);

    const payload = {
      ...(isEditMode && editId ? { id: Number(editId) } : {}),
      customerID: customer?.id,
      customerCode: customer?.code || "",
      customerName: customer?.firstName || customer?.name || "",
      customerContactNo:
        customer?.contactNo || customer?.mobile || customer?.phone || "",
      documentDate: quotationDate,
      remark,
      billToline1: address1,
      billToline2: address2,
      billToline3: address3,
      billToline4: address4,
      grossTotal: totalGross,
      netTotal: totalGross,
      salesPersonId: salesPerson?.id || null,
      salesPersonCode: salesPerson?.code || "",
      salesPersonName: salesPerson?.name || salesPerson?.Name || "",
      salesQuotationLines: lines,
    };

    const saveUrl = isEditMode
      ? `${BASE_URL}/SalesQuotation/UpdateSalesQuotation`
      : `${BASE_URL}/SalesQuotation/CreateSalesQuotation`;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(saveUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.statusCode === 200) {
        toast.success(
          data.message ||
            (isEditMode
              ? "Sales Quotation updated successfully."
              : "Sales Quotation created successfully.")
        );
        setTimeout(() => {
          router.push("/sales/sales-quotation");
        }, 800);
      } else {
        toast.error(
          data.message ||
            (isEditMode
              ? "Failed to update Sales Quotation."
              : "Failed to create Sales Quotation.")
        );
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error.message ||
          (isEditMode
            ? "Failed to update Sales Quotation."
            : "Failed to create Sales Quotation.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!router.isReady) {
    return (
      <>
        <ToastContainer />
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (!canUsePage) {
    return <AccessDenied />;
  }

  if (isEditMode && loadingQuotation) {
    return (
      <>
        <ToastContainer />
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>{isEditMode ? "Edit Sales Quotation" : "Create Sales Quotation"}</h1>
        <ul>
          <li>
            <Link href="/sales/sales-quotation/">Sales Quotation</Link>
          </li>
          <li>{isEditMode ? "Edit" : "Create"}</li>
        </ul>
      </div>

      <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1, boxShadow: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2} flexWrap="wrap" alignItems="center">
              <Button variant="outlined" disabled size="small">
                <Typography sx={{ fontWeight: "bold", fontSize: "14px" }}>
                  Quotation No: {quotationNo || "—"}
                </Typography>
              </Button>
              <Button variant="outlined" onClick={navigateToBack} sx={goBackButtonSx}>
                Go back
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Customer <span style={{ color: "red" }}>*</span>
              </Typography>
              <Box sx={{ width: "60%", display: "flex", gap: 1, alignItems: "flex-start" }}>
                <Autocomplete
                  sx={{ flex: 1 }}
                  options={customers || []}
                  getOptionLabel={(option) =>
                    option?.firstName || option?.name || ""
                  }
                  value={customer}
                  onChange={(event, newValue) => {
                    setCustomer(newValue);
                    if (newValue) {
                      setAddress1(newValue.addressLine1 || "");
                      setAddress2(newValue.addressLine2 || "");
                      setAddress3(newValue.addressLine3 || "");
                      setAddress4(newValue.addressLine4 || "");
                    } else {
                      setAddress1("");
                      setAddress2("");
                      setAddress3("");
                      setAddress4("");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      fullWidth
                      placeholder="Search Customer"
                    />
                  )}
                />
                <Tooltip title="Create new customer" placement="top">
                  <IconButton
                    size="small"
                    aria-label="create new customer"
                    onClick={() => setCustomerModalOpen(true)}
                    sx={{
                      mt: "2px",
                      border: "1px solid",
                      borderColor: "primary.main",
                      borderRadius: 1,
                      color: "primary.main",
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>

            <Grid item xs={12} display="flex" flexDirection="column" mt={1}>
              <Grid item xs={12} display="flex" justifyContent="space-between">
                <Typography
                  component="label"
                  sx={{
                    fontWeight: "500",
                    p: 1,
                    fontSize: "14px",
                    display: "block",
                    width: "35%",
                  }}
                >
                  Bill to
                </Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  placeholder="Address Line 1"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  placeholder="Address Line 2"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  placeholder="Address Line 3"
                  value={address3}
                  onChange={(e) => setAddress3(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  placeholder="Address Line 4"
                  value={address4}
                  onChange={(e) => setAddress4(e.target.value)}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} lg={6} display="flex" flexDirection="column">
            <Grid container>
              <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                mt={1}
              >
                <Typography
                  component="label"
                  sx={{
                    fontWeight: "500",
                    p: 1,
                    fontSize: "14px",
                    display: "block",
                    width: "35%",
                  }}
                >
                  Quotation No
                </Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  value={quotationNo}
                  placeholder="Loading…"
                  disabled
                />
              </Grid>

              <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                mt={1}
              >
                <Typography
                  component="label"
                  sx={{
                    fontWeight: "500",
                    p: 1,
                    fontSize: "14px",
                    display: "block",
                    width: "35%",
                  }}
                >
                  Date <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  type="date"
                  fullWidth
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                />
              </Grid>

              <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                mt={1}
              >
                <Typography
                  component="label"
                  sx={{
                    fontWeight: "500",
                    p: 1,
                    fontSize: "14px",
                    display: "block",
                    width: "35%",
                  }}
                >
                  Remark
                </Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </Grid>

              <Grid
                item
                xs={12}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mt={1}
              >
                <Typography
                  component="label"
                  sx={{
                    fontWeight: "500",
                    p: 1,
                    fontSize: "14px",
                    display: "block",
                    width: "35%",
                  }}
                >
                  Salesperson
                </Typography>
                <Autocomplete
                  sx={{ width: "60%" }}
                  options={salesPersonList || []}
                  getOptionLabel={(option) => option?.name || option?.Name || ""}
                  isOptionEqualToValue={(option, value) =>
                    option?.id === value?.id
                  }
                  value={salesPerson}
                  onChange={(event, newValue) => setSalesPerson(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      fullWidth
                      placeholder="Select Salesperson (Optional)"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Box mt={3}>
          <Typography
            sx={{ fontWeight: 600, fontSize: "15px", mb: 1 }}
          >
            Items
          </Typography>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} md={6}>
              <SearchItemByName
                ref={searchRef}
                label="Search Item"
                placeholder="Search item by name..."
                fetchUrl={`${BASE_URL}/Items/GetAllItemsByName`}
                onSelect={(item) => handleAddItem(item)}
                getResultLabel={(item) => item.name}
              />
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Item Code</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Selling Price (Rs)</TableCell>
                  <TableCell align="right">Line Total (Rs)</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">
                        No items added. Use the search above to add items.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedRows.map((row, index) => (
                    <TableRow key={`${row.productId}-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.productCode}</TableCell>
                      <TableCell>{row.productName}</TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: "any", style: { textAlign: "right" } }}
                          value={row.qty}
                          inputRef={(el) => handleQtyRef(el, index)}
                          onChange={(e) => handleQtyChange(index, e.target.value)}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: "any", style: { textAlign: "right" } }}
                          value={row.sellingPrice}
                          onChange={(e) => handlePriceChange(index, e.target.value)}
                          sx={{ width: 130 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(row.lineTotal)}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Remove" placement="top">
                          <IconButton
                            aria-label="delete"
                            size="small"
                            onClick={() => handleDeleteRow(index)}
                          >
                            <DeleteIcon color="error" fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container justifyContent="flex-end" mt={2}>
            <Box
              sx={{
                minWidth: 280,
                p: 2,
                borderRadius: 1,
                bgcolor: "action.hover",
              }}
            >
              <Box display="flex" justifyContent="space-between">
                <Typography sx={{ fontWeight: 500 }}>Gross Total (Rs)</Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {formatCurrency(grossTotal)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography sx={{ fontWeight: 600 }}>Net Total (Rs)</Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  {formatCurrency(grossTotal)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Box>

        <Box display="flex" justifyContent="flex-start" gap={1} mt={3}>
          <LoadingButton
            loading={isSubmitting}
            disabled={isSubmitting || loadingQuotation}
            handleSubmit={handleSubmit}
          />
        </Box>
      </Box>

      <AddCustomerDialog
        fetchItems={fetchCustomersAfterCreate}
        chartOfAccounts={chartOfAccounts}
        externalOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        showButton={false}
      />
    </>
  );
};

export default CreateSalesQuotation;

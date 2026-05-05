import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { formatDate } from "@/components/utils/formatHelper";

const StockCycleCountEdit = () => {
  const router = useRouter();
  const { id } = router.query;
  const cId = sessionStorage.getItem("category");
  const { navigate } = IsPermissionEnabled(cId);

  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(formatDate(new Date()));
  const [status, setStatus] = useState(0);
  const [statusOptions, setStatusOptions] = useState([]);
  const [remark, setRemark] = useState("");
  const [documentNo, setDocumentNo] = useState("");
  const [tableItems, setTableItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = () => {
    router.push("/inventory/stock-cycle-count");
  };

  const handleStockForEndDateChange = (index, value) => {
    const updated = [...tableItems];
    updated[index] = { ...updated[index], stockForEndDate: value };
    setTableItems(updated);
  };

  const handleSubmit = async () => {
    if (!endDate || endDate.trim() === "") {
      toast.error("End Date is required.");
      return;
    }
    if (tableItems.length === 0) {
      toast.error("At least one line item is required.");
      return;
    }
    const invalidStock = tableItems.some((row) => {
      const val = row.stockForEndDate;
      if (val === "" || val == null) return true;
      const num = Number(val);
      return isNaN(num) || num < 0;
    });
    if (invalidStock) {
      toast.error("Stock for End Date quantity is required for all line items.");
      return;
    }

    const payload = {
      Id: Number(id),
      StartDate: startDate,
      EndDate: endDate,
      Status: status,
      Remark: remark || "",
      StockCycleCountLineDetails: tableItems.map((row) => ({
        Id: row.lineId,
        ProductCode: row.code,
        ProductId: row.id,
        ProductName: row.name,
        SupplierId: row.supplierId ?? 0,
        CategoryId: row.categoryId ?? 0,
        SubCategoryId: row.subCategoryId ?? 0,
        StockForStartDate: Number(row.stockForStartDate) ?? 0,
        StockForEndDate: Number(row.stockForEndDate) ?? 0,
      })),
    };

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/StockCycleCount/UpdateStockCycleCount`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data?.statusCode !== -99) {
        toast.success(data?.message || "Stock Cycle Count updated successfully.");
        setTimeout(() => {
          router.push("/inventory/stock-cycle-count");
        }, 1000);
      } else {
        toast.error(data?.message || "Failed to update Stock Cycle Count.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update Stock Cycle Count.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchStatusOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/EnumLookup/ActivityStatuses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        const options = data?.result
          ? Object.entries(data.result).map(([value, label]) => ({
              value: Number(value),
              label,
            }))
          : [];
        setStatusOptions(options);
      } catch (err) {
        console.error("Failed to load status options:", err);
      }
    };
    fetchStatusOptions();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${BASE_URL}/StockCycleCount/GetStockCycleCountById?id=${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          toast.error("Failed to load Stock Cycle Count.");
          return;
        }

        const data = await res.json();
        const result = data?.result;

        if (!result) {
          toast.error("Stock Cycle Count not found.");
          return;
        }

        const start = result.startDate || result.StartDate;
        const end = result.endDate || result.EndDate;

        setStartDate(start ? formatDate(new Date(start)) : "");
        setEndDate(end ? formatDate(new Date(end)) : formatDate(new Date()));
        setStatus(result.status ?? result.Status ?? 0);
        setRemark(result.remark ?? result.Remark ?? "");
        setDocumentNo(result.documentNo ?? result.DocumentNo ?? "");

        const lines = result.stockCycleCountLineDetails ?? result.StockCycleCountLineDetails ?? [];
        setTableItems(
          lines.map((line) => ({
            lineId: line.id ?? line.Id,
            id: line.productId ?? line.ProductId,
            code: line.productCode ?? line.ProductCode ?? "",
            name: line.productName ?? line.ProductName ?? "",
            supplierId: line.supplierId ?? line.SupplierId ?? 0,
            categoryId: line.categoryId ?? line.CategoryId ?? 0,
            subCategoryId: line.subCategoryId ?? line.SubCategoryId ?? 0,
            supplierName: line.supplierName ?? "-",
            categoryName: line.categoryName ?? "-",
            subCategoryName: line.subCategoryName ?? "-",
            uomName: "-",
            stockForStartDate: line.stockForStartDate ?? line.StockForStartDate ?? 0,
            stockForEndDate:
              line.stockForEndDate != null || line.StockForEndDate != null
                ? String(line.stockForEndDate ?? line.StockForEndDate ?? "")
                : "",
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Stock Cycle Count.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (!navigate) {
    return <AccessDenied />;
  }

  if (loading) {
    return (
      <div className={styles.pageTitle}>
        <Typography>Loading...</Typography>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Stock Cycle Count Edit</h1>
        <ul>
          <li>
            <Link href="/inventory/stock-cycle-count">Stock Cycle Count</Link>
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
          <Grid container p={1}>
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: "bold" }}>
                Document No: {documentNo}
              </Typography>
            </Grid>

            <Grid
              item
              xs={12}
              lg={6}
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
                Start Date
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={startDate}
                disabled
              />
            </Grid>

            <Grid
              item
              xs={12}
              lg={6}
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
                End Date <span style={{ color: "#d32f2f" }}>*</span>
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Grid>

            <Grid
              item
              xs={12}
              lg={6}
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
                Status
              </Typography>
              <FormControl sx={{ width: "60%" }} size="small">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(Number(e.target.value))}
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              item
              xs={12}
              lg={6}
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
                placeholder="Enter remark"
              />
            </Grid>

            <Grid item xs={12} mt={2}>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="stock cycle count items" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}>Code</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product Name</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Supplier</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Category</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Sub Category</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Stock for Start Date</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Stock for End Date <span style={{ color: "#ffcdd2" }}>*</span>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="textSecondary">
                            No line items
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableItems.map((row, index) => (
                        <TableRow key={row.lineId || index}>
                          <TableCell>{row.code}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.supplierName}</TableCell>
                          <TableCell>{row.categoryName}</TableCell>
                          <TableCell>{row.subCategoryName}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              value={row.stockForStartDate}
                              disabled
                              inputProps={{ min: 0 }}
                              sx={{ maxWidth: 120 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              value={row.stockForEndDate}
                              onChange={(e) =>
                                handleStockForEndDateChange(index, e.target.value)
                              }
                              inputProps={{ min: 0 }}
                              sx={{ maxWidth: 120 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} mt={3} display="flex" justifyContent="end" sx={{ gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <Typography sx={{ fontWeight: "bold" }}>Cancel</Typography>
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting || tableItems.length === 0}
              >
                <Typography sx={{ fontWeight: "bold" }}>
                  {isSubmitting ? "Updating..." : "Update"}
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default StockCycleCountEdit;

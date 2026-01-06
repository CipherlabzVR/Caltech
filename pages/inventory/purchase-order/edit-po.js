import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
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
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import AddPOProducts from "@/components/UIElements/Modal/AddPOProducts";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

const POEdit = () => {
  const router = useRouter();
  const [isSubmit, setIsSubmit] = useState(false);
  const [isCredit, setIsCredit] = useState(false);
  const [grossTotal, setGrossTotal] = useState(null);
  const { id } = router.query;
  const [selectedRows, setSelectedRows] = useState([]);
  const [poTallyList, setPOTallyList] = useState([]);
  const [po, setPO] = useState();
  const [isDisable, setIsDisable] = useState(false);

  const { data: IsEnableCreditGRN } =
    IsAppSettingEnabled("IsEnableCreditGRN");

  const fetchPOTally = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/GoodReceivedNote/GetAllPOTally`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch PO");
      }

      const data = await response.json();
      const result = data.result;

      const summary = result.reduce((acc, item) => {
        const key = `${item.productId}-${item.purchaseOrderNo}`;

        if (!acc[key]) {
          acc[key] = {
            productId: item.productId,
            purchaseOrderNo: item.purchaseOrderNo,
            weightedUnitPriceTotal: 0,
            weightedAdditionalCostTotal: 0,
            totalFreightDutyDisplay: 0,
            totalAdditionalDisplay: 0,
            totalReceivedQty: 0,
          };
        }

        const receivedQty = Number(item.poReceivedQty) || 0;
        const shipmentUnitPrice = Number(item.shipmentUnitPrice) || 0;
        const shipmentAdditionalCost = Number(item.shipmentAdditionalCost) || 0;
        const shipmentFreightDutyCost = Number(item.shipmentFreightDutyCost) || 0;

        if (receivedQty > 0) {
          acc[key].weightedUnitPriceTotal += shipmentUnitPrice * receivedQty;
          acc[key].weightedAdditionalCostTotal +=
            (shipmentAdditionalCost + shipmentFreightDutyCost) * receivedQty;
          acc[key].totalReceivedQty += receivedQty;
        }

        acc[key].totalFreightDutyDisplay += shipmentFreightDutyCost;
        acc[key].totalAdditionalDisplay += shipmentAdditionalCost;

        return acc;
      }, {});
      const summaryArray = Object.values(summary).map((item) => ({
        ...item,
        averageUnitPrice:
          item.totalReceivedQty > 0
            ? item.weightedUnitPriceTotal / item.totalReceivedQty
            : 0,
        averageFreightDutyCost:
          item.totalReceivedQty > 0
            ? item.weightedAdditionalCostTotal / item.totalReceivedQty
            : 0,
        poReceivedQty: item.totalReceivedQty,
        totalFreightDutyCost: item.totalFreightDutyDisplay,
        totalAdditionalCost: item.totalAdditionalDisplay,
      }));
      setPOTallyList(summaryArray);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };
  const fetchPO = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/GoodReceivedNote/GetPurchaseOrderById?id=${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch PO");
      }

      const data = await response.json();
      setPO(data.result);
      setIsCredit(data.result.isCredit);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedRows = selectedRows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    setSelectedRows(updatedRows);
  };

  useEffect(() => {
    if (po) {
      const updatedRows = po.goodReceivedNoteLineDetails.map((row) => {
        const matchedItem = poTallyList.find(
          (tally) =>
            tally.productId === row.productId &&
            tally.purchaseOrderNo === row.purchaseOrderNo
        );


        const avgUnitPrice = matchedItem ? matchedItem.averageUnitPrice : 0;
        const rawFreightCost = matchedItem?.averageFreightDutyCost || 0;
        const avgFreighCost = !isFinite(rawFreightCost) ? 0 : rawFreightCost;

        const costPrice = avgUnitPrice + avgFreighCost;
        const poReceivedQty = matchedItem ? matchedItem.poReceivedQty : 0;
        const lineTot = costPrice.toFixed(2) * poReceivedQty;

        return {
          ...row,
          avgUnitPrice: avgUnitPrice.toFixed(2),
          avgFreighCost: avgFreighCost.toFixed(2),
          costPrice: costPrice.toFixed(2),
          poReceivedQty,
          lineTot: lineTot.toFixed(2),
        };
      });

      setSelectedRows(updatedRows);
    }
  }, [po, poTallyList]);

  useEffect(() => {
    fetchPO();
    fetchPOTally();
  }, []);

  const navigateToBack = () => {
    router.push({
      pathname: "/inventory/purchase-order",
    });
  };
  const handleSubmit = async () => {
    const totalQty = selectedRows.reduce(
      (total, row) => total + (Number(row.poReceivedQty) || 0),
      0
    );

    const invalidQty = selectedRows.find((row) => row.poReceivedQty <= 0);
    if (invalidQty) {
      toast.info("Received Quantity Cannot be 0.");
      return;
    }

    const missingSellingPrice = selectedRows.find(
      (row) => !row.sellingPrice || row.sellingPrice === "" || row.sellingPrice === null || row.sellingPrice === undefined
    );
    if (missingSellingPrice) {
      toast.info("Selling Price is required.");
      return;
    }

    const invalidRow = selectedRows.find(
      (row) =>
        parseFloat(row.sellingPrice) <= 0 ||
        parseFloat(row.sellingPrice) <= parseFloat(row.costPrice)
    );
    
    if (invalidRow) {
      toast.info("Please Enter Selling Price greater than Cost Price.");
      return;
    }

    const data = {
      PurchaseOrderNo: po.purchaseOrderNo,
      SupplierId: po.supplierId,
      SupplierCode: "0",
      SupplierName: po.supplierName,
      ReferanceNo: po.referanceNo,
      GRNDate: po.grnDate,
      Remark: po.remark,
      WarehouseId: po.warehouseId,
      WarehouseCode: po.warehouseCode,
      WarehouseName: po.warehouseName,
      InventoryPeriodId: po.inventoryPeriodId,
      TotalAmount: grossTotal,
      TotalQty: totalQty,
      IsCredit: isCredit,
      GoodReceivedNoteLineDetails: selectedRows.map((row, index) => ({
        GRNHeaderID: row.grnHeaderID,
        DocumentNo: row.purchaseOrderNo,
        PurchaseOrderNo: row.purchaseOrderNo,
        SequenceNumber: index + 1,
        WarehouseId: row.warehouseId,
        WarehouseCode: row.warehouseCode,
        WarehouseName: row.warehouseName,
        ProductId: row.productId,
        ProductCode: row.productCode,
        ProductName: row.productName,
        Batch: row.batch,
        ExpDate: row.expDate,
        UnitPrice: row.avgUnitPrice,
        AdditionalCost: row.avgFreighCost,
        CostPrice: row.costPrice,
        SellingPrice: row.sellingPrice,
        MaximumSellingPrice: row.maxSellingPrice,
        Qty: row.poReceivedQty,
        Free: row.free,
        DiscountRate: row.discountRate,
        DiscountAmount: row.discountAmount,
        Status: row.status,
        Remark: row.remark,
        LineTotal: row.lineTot,
        AverageCostPrice: 0.0,
      })),
    };
    try {
      setIsSubmit(true);
      const response = await fetch(
        `${BASE_URL}/GoodReceivedNote/UpdatePurchaseOrder`,
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
        if (jsonResponse.result.result != "") {
          setIsDisable(true);
          toast.success(jsonResponse.result.message);
          setTimeout(() => {
            window.location.href = "/inventory/purchase-order";
          }, 1500);
          S;
        } else {
          toast.error(jsonResponse.result.message);
        }
      } else {
        toast.error("Please fill all required fields");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmit(false);
    }
  };

  useEffect(() => {
    const gross = selectedRows.reduce(
      (gross, row) => gross + (Number(row.lineTot) || 0),
      0
    );
    setGrossTotal(gross);
  }, [selectedRows]);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Purchase Order Edit</h1>
        <ul>
          <li>
            <Link href="/inventory/purchase-order">Purchase Order</Link>
          </li>
          <li> Edit</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item gap={2} xs={12} display="flex" justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>
                  PO No: {po && po.purchaseOrderNo}
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
                Supplier
              </Typography>

              <TextField
                disabled
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={po && po.supplierName}
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
                Reference No:
              </Typography>
              <TextField
                disabled
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={po && po.referenceNo}
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
                GRN Date
              </Typography>
              <TextField
                disabled
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={po && po.poDate.substring(0, 10)}
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
                Remark
              </Typography>
              <TextField
                disabled
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={po && po.remark}
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
                PO Type
              </Typography>
              <TextField
                disabled
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={po && po.type == 1 ? "Local" : "Import"}
              />
            </Grid>
            {IsEnableCreditGRN ? <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Box sx={{ marginLeft: '10px' }}>
                <FormControlLabel control={<Checkbox checked={isCredit} onChange={(e) => setIsCredit(e.target.checked)} />} label="Credit Payment" />
              </Box>
            </Grid> : ""}

            <Grid item xs={12} my={2}>
              <TableContainer component={Paper}>
                <Table
                  size="small"
                  aria-label="simple table"
                  className="dark-table"
                >
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}>#</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Product&nbsp;Name
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Batch</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Exp&nbsp;Date
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Ordered Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Received Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Unit&nbsp;Price
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Freight&nbsp;Duty & Transport
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Cost&nbsp;Price
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Selling&nbsp;Price
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Discount</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Status</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Remark</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Total&nbsp;Cost
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRows.map((row, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell sx={{ p: 1 }}>{index + 1}</TableCell>
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {row.productName}
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <Typography>{row.batch}</Typography>
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="date"
                            sx={{ width: "150px" }}
                            fullWidth
                            value={formatDate(row.expDate)}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "expDate",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>{row.poQty}</TableCell>
                        <TableCell>
                          <AddPOProducts
                            item={row}
                            fetchPO={fetchPO}
                            fetchPOTally={fetchPOTally}
                          />
                        </TableCell>
                        <TableCell>{row.poReceivedQty}</TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <Typography>{row.avgUnitPrice}</Typography>
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>{formatCurrency(row.avgFreighCost)}</TableCell>
                        <TableCell sx={{ p: 1 }}>{formatCurrency(row.costPrice)}</TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            sx={{ width: "150px" }}
                            fullWidth
                            value={row.sellingPrice === 0 || row.sellingPrice === null || row.sellingPrice === undefined ? "" : row.sellingPrice}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "sellingPrice",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            sx={{ width: "150px" }}
                            value={row.discountAmount === 0 || row.discountAmount === null || row.discountAmount === undefined ? "" : row.discountAmount}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "discountAmount",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <Select
                            label="Status"
                            value={row.status}
                            onChange={(e) =>
                              handleInputChange(index, "status", e.target.value)
                            }
                            sx={{ width: "150px" }}
                            size="small"
                          >
                            <MenuItem value="Approval">Approval</MenuItem>
                            <MenuItem value="Damage">Damage</MenuItem>
                          </Select>
                        </TableCell>

                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="text"
                            fullWidth
                            sx={{ width: "150px" }}
                            value={row.remark || ""}
                            onChange={(e) =>
                              handleInputChange(index, "remark", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ p: 1 }}>
                          {formatCurrency(row.lineTot)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={13} align="right">
                        <Typography variant="h6">Total</Typography>
                      </TableCell>
                      <TableCell colSpan={14} align="right">
                        <Typography variant="h6">
                          {formatCurrency(grossTotal)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} my={3}>
              <LoadingButton
                loading={isSubmit}
                handleSubmit={() => handleSubmit()}
                disabled={isDisable}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default POEdit;

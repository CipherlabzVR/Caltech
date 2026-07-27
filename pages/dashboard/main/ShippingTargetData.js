import React, { useEffect, useState } from "react";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import * as XLSX from "xlsx";
import BASE_URL from "Base/api";
import GetAllSuppliers from "@/components/utils/GetAllSuppliers";

const headerCellSx = {
  borderBottom: "1px solid #F7FAFF",
  fontSize: "13.5px",
  padding: "15px 10px",
  fontWeight: 600,
  backgroundColor: (theme) =>
    theme.palette.mode === "dark" ? theme.palette.background.paper : "#F7FAFF",
  zIndex: 3,
};

const targetHeaderCellSx = {
  ...headerCellSx,
  fontWeight: 700,
  color: "#000000",
};

const targetCellSx = {
  fontWeight: 700,
  fontSize: "13px",
  borderBottom: "1px solid #F7FAFF",
  color: "#000000",
  padding: "9px 10px",
};

const greenHeaderCellSx = {
  ...headerCellSx,
  fontWeight: 700,
  color: "#66BB6A",
};

const greenCellSx = {
  fontWeight: 700,
  fontSize: "13px",
  borderBottom: "1px solid #F7FAFF",
  color: "#66BB6A",
  padding: "9px 10px",
};

const redHeaderCellSx = {
  ...headerCellSx,
  fontWeight: 700,
  color: "#EF5350",
};

const redCellSx = {
  fontWeight: 700,
  fontSize: "13px",
  borderBottom: "1px solid #F7FAFF",
  color: "#EF5350",
  padding: "9px 10px",
};

const ShippingTargetData = () => {
  const [data, setData] = useState([]);
  const [select, setSelect] = useState(0);
  const [supplier, setSupplier] = useState(0);
  const [categoryList, setCategoryList] = useState([]);
  const { data: supplierList } = GetAllSuppliers();

  const handleChange = (event) => {
    const categoryId = event.target.value;
    setSelect(categoryId);
    fetchShippingData(categoryId, supplier);
  };

  const handleSupplierChange = (event) => {
    const supplierId = event.target.value;
    setSupplier(supplierId);
    fetchShippingData(select, supplierId);
  };

  const fetchCategoryList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/SubCategory/GetAllSubCategory`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch Category List");

      const result = await response.json();
      const categories = result.result || [];
      setCategoryList(categories);
    } catch (error) {
      console.error("Error fetching Category List:", error);
    }
  };

  const fetchShippingData = async (category, supplierId = 0) => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/Dashboard/GetShippingTargetData?subCategoryId=${category}&supplierId=${supplierId}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch items");
      const result = await response.json();
      setData(result.result || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleExportExcel = () => {
    if (!data.length) return;
    const aoa = [
      [
        "Item",
        "Stock Target",
        "Stock",
        "Stock Deficit",
        "Shipping Target",
        "Order Sum",
        "Shipping Deficit",
        "Total Deficit",
      ],
      ...data.map((row) => [
        row.productName,
        row.stockTarget,
        row.stock,
        row.stockDeficit,
        row.shippingTarget,
        row.orderSum,
        row.shippingDeficit,
        row.totalDeficit,
      ]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shipping Target Data");
    XLSX.writeFile(workbook, `shipping-target-data-${Date.now()}.xlsx`);
  };

  useEffect(() => {
    fetchShippingData(select, supplier);
    fetchCategoryList();
  }, []);


  return (
    <Card sx={{ boxShadow: "none", borderRadius: "10px", p: "25px 20px 15px", mb: "15px" }}>
      <Box sx={{
        paddingBottom: "10px", display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Typography as="h3" sx={{ fontSize: 18, fontWeight: 500 }}>
          Shipping Target Data
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            variant="outlined"
            size="small"
            color="success"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            disabled={!data.length}
            sx={{ textTransform: "none", fontSize: "13px" }}
          >
            Excel
          </Button>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel id="supplier-label" sx={{ fontSize: "14px" }}>
              Supplier
            </InputLabel>
            <Select
              labelId="supplier-label"
              id="supplier-select"
              value={supplier}
              label="Supplier"
              onChange={handleSupplierChange}
              sx={{ fontSize: "14px" }}
            >
              <MenuItem value={0}>All</MenuItem>
              {(supplierList || []).map((item) => (
                <MenuItem key={item.id} value={item.id} sx={{ fontSize: "14px" }}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel id="category-label" sx={{ fontSize: "14px" }}>
              Sub Category
            </InputLabel>
            <Select
              labelId="category-label"
              id="category-select"
              value={select}
              label="Sub Category"
              onChange={handleChange}
              sx={{ fontSize: "14px" }}
            >
              <MenuItem value={0}>All</MenuItem>
              {categoryList.map((item) => (
                <MenuItem key={item.id} value={item.id} sx={{ fontSize: "14px" }}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          boxShadow: "none",
          maxHeight: "50vh",
          overflowY: "auto",
          height: 'auto'
        }}
      >
        <Table
          stickyHeader
          sx={{ minWidth: 500 }}
          aria-label="custom pagination table"
          className="dark-table"
        >
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx}>Item</TableCell>
              <TableCell sx={targetHeaderCellSx}>Stock Target</TableCell>
              <TableCell sx={greenHeaderCellSx}>Stock</TableCell>
              <TableCell sx={redHeaderCellSx}>Stock Deficit</TableCell>
              <TableCell sx={targetHeaderCellSx}>Shipping Target</TableCell>
              <TableCell sx={greenHeaderCellSx}>Order Sum</TableCell>
              <TableCell sx={redHeaderCellSx}>Shipping Deficit</TableCell>
              <TableCell sx={redHeaderCellSx}>Total Deficit</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((row) => (
              <TableRow key={row.task}>
                <TableCell sx={{ fontWeight: "500", fontSize: "13px", borderBottom: "1px solid #F7FAFF", color: "#260944", padding: "9px 10px" }}>
                  {row.productName}
                </TableCell>
                <TableCell sx={targetCellSx}>
                  {row.stockTarget}
                </TableCell>
                <TableCell sx={greenCellSx}>
                  {row.stock}
                </TableCell>
                <TableCell sx={redCellSx}>
                  {row.stockDeficit}
                </TableCell>
                <TableCell sx={targetCellSx}>
                  {row.shippingTarget}
                </TableCell>
                <TableCell sx={greenCellSx}>
                  {row.orderSum}
                </TableCell>
                <TableCell sx={redCellSx}>
                  {row.shippingDeficit}
                </TableCell>
                <TableCell sx={redCellSx}>
                  {row.totalDeficit}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default ShippingTargetData;

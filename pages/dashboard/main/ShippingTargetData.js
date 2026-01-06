import React, { useEffect, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import BASE_URL from "Base/api";

const ShippingTargetData = () => {
  const [data, setData] = useState([]);
  const [select, setSelect] = useState(0);
  const [categoryList, setCategoryList] = useState([]);

  const handleChange = (event) => {
    const categoryId = event.target.value;
    setSelect(categoryId);
    fetchShippingData(categoryId);
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

  const fetchShippingData = async (category) => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/Dashboard/GetShippingTargetData?subCategoryId=${category}`;
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

  useEffect(() => {
    fetchShippingData(select);
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
          sx={{ minWidth: 500 }}
          aria-label="custom pagination table"
          className="dark-table"
        >
          <TableHead sx={{ background: "#F7FAFF" }}>
            <TableRow>
              <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Item
              </TableCell>
              <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Stock
              </TableCell>
              <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Stock Target
              </TableCell>
              <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Stock Deficit
              </TableCell>
              <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Order Sum
              </TableCell>
              <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Shipping Target
              </TableCell>
              <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Shipping Deficit
              </TableCell>
              <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Total Deficit
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((row) => (
              <TableRow key={row.task}>
                <TableCell sx={{ fontWeight: "500", fontSize: "13px", borderBottom: "1px solid #F7FAFF", color: "#260944", padding: "9px 10px" }}>
                  {row.productName}
                </TableCell>
                <TableCell sx={{ fontWeight: 500, borderBottom: "1px solid #F7FAFF", fontSize: "12px", padding: "9px 10px" }}>
                  {row.stock}
                </TableCell>
                <TableCell sx={{ fontWeight: "500", fontSize: "13px", borderBottom: "1px solid #F7FAFF", color: "#260944", padding: "9px 10px" }}>
                  {row.stockTarget}
                </TableCell>
                <TableCell sx={{ fontWeight: 500, borderBottom: "1px solid #F7FAFF", fontSize: "12px", padding: "9px 10px" }}>
                  {row.stockDeficit}
                </TableCell>
                <TableCell sx={{ fontWeight: "500", fontSize: "13px", borderBottom: "1px solid #F7FAFF", color: "#260944", padding: "9px 10px" }}>
                  {row.orderSum}
                </TableCell>
                <TableCell sx={{ fontWeight: 500, borderBottom: "1px solid #F7FAFF", fontSize: "12px", padding: "9px 10px" }}>
                  {row.shippingTarget}
                </TableCell>
                <TableCell sx={{ fontWeight: "500", fontSize: "13px", borderBottom: "1px solid #F7FAFF", color: "#260944", padding: "9px 10px" }}>
                  {row.shippingDeficit}
                </TableCell>
                <TableCell sx={{ fontWeight: 500, borderBottom: "1px solid #F7FAFF", fontSize: "12px", padding: "9px 10px" }}>
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

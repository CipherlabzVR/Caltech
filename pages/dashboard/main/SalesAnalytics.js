import React, { useEffect, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import Card from "@mui/material/Card";
import { Typography } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import BASE_URL from "Base/api";

const SalesAnalytics = () => {
  const [data, setData] = useState([]);
  const [select, setSelect] = useState(0);
  const [categoryList, setCategoryList] = useState([]);

  const handleChange = (event) => {    
    const categoryId = event.target.value;
    setSelect(categoryId);
    fetchStockBalance(categoryId);
  };

  const fetchStockBalance = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/Dashboard/GetStockByCategory?subCategoryId=${id}`;
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
      fetchStockBalance(select);
    } catch (error) {
      console.error("Error fetching Category List:", error);
    }
  };

  useEffect(() => {
    fetchCategoryList();
  }, []);

  return (
    <Card
      sx={{
        boxShadow: "none",
        borderRadius: "10px",
        p: "25px",
        mb: "15px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #EEF0F7",
          paddingBottom: "10px",
          marginBottom: "15px",
        }}
      >
        <Typography
          as="h3"
          sx={{
            fontSize: 18,
            fontWeight: 500,
          }}
        >
          Stock Balance
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

      <div style={{ width: "100%", maxHeight: "50vh", overflowY: "auto" }}>
        <div style={{ height: Math.max(250, data.length * 30), width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                fontSize={12}
                stroke="#A9A9C8"
                tick={{ fill: "#555" }}
                domain={['auto', 'auto']}
              />
              <YAxis
                type="category"
                dataKey="productName"
                fontSize={12}
                stroke="#A9A9C8"
                tick={{ fill: "#333" }}
                width={180}
              />
              <Tooltip wrapperStyle={{ fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="stock" fill="#A155B9" name="Stock" />
              <Bar dataKey="reorderLevel" fill="#F87171" name="Reorder Level" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};

export default SalesAnalytics;

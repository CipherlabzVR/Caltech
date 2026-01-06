import React from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { useState, useEffect } from "react";
import useApi from "@/components/utils/useApi";

export default function BasicSelect({onChangeWarehouse}) {
  const [outlet, setOutlet] = React.useState(0);
  const [warehouseList, setWarehouseList] = useState([]);
  const { data: warehouses } = useApi("/Warehouse/GetAllWarehouse");

  const handleChange = (value) => {
    setOutlet(value);
  };

  useEffect(() => {
    if (warehouses) {
      setWarehouseList(warehouses);
    }
  }, [warehouses]);

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Select Outlet</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={outlet}
          label="Select Outlet"
          onChange={(e)=>{
            handleChange(e.target.value);
            onChangeWarehouse(e.target.value);
          }}
          defaultValue=""
        >
          <MenuItem value={0}>All</MenuItem>
          {warehouseList.map((warehouse, index) => (
            <MenuItem key={index} value={warehouse.id}>
              {warehouse.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

import React, { useState } from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  IconButton,
  Grid,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Delete from "@mui/icons-material/RemoveTwoTone";
import Add from "@mui/icons-material/AddTwoTone";
import SearchIcon from "@mui/icons-material/Search";
import { InputAdornment } from "@mui/material";
import { Autocomplete } from "@mui/material"; // Import Autocomplete component
import styles from "@/styles/PageTitle.module.css";



const TypographyHeadingStyles = {
  fontWeight: "500",
  fontSize: "14px",
  mt: "25px",
  width: "300px",
};

const EditableTable = () => {
  const [rows, setRows] = useState([
    { id: 1, item: "", quantity: "", description: "", unitPrice: "", discount: "", discountedPrice: "" },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState({});
  const [customerName, setCustomerName] = useState(""); 
  const [savedCustomerNames, setSavedCustomerNames] = useState([
    "Pavani",
    "Semini",
    "Jayakodi",
    "Arachchi",
  ]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const calculateDiscountedPrice = (unitPrice, discount) => {
    const price = parseFloat(unitPrice) || 0;
    const disc = parseFloat(discount) || 0;
    return (price - disc).toFixed(2);
  };

  const handleInputChange = (id, field, value) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };

          if (field === "discount" || field === "unitPrice") {
            const unitPrice = parseFloat(updatedRow.unitPrice) || 0;
            const discount = parseFloat(updatedRow.discount) || 0;

            if (discount > unitPrice) {
              setError((prevError) => ({ ...prevError, [id]: "Discount cannot exceed Unit Price." }));
              updatedRow.discountedPrice = "";
            } else {
              setError((prevError) => ({ ...prevError, [id]: "" }));
              updatedRow.discountedPrice = calculateDiscountedPrice(updatedRow.unitPrice, updatedRow.discount);
            }
          }
          return updatedRow;
        }
        return row;
      })
    );
  };

  const handleDeleteRow = (id) => {
    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
  };

  const handleAddRow = () => {
    setRows((prevRows) => [
      ...prevRows,
      { id: prevRows.length + 1, item: "", quantity: "", description: "", unitPrice: "", discount: "", discountedPrice: "" },
    ]);
  };

  const handleSubmit = () => {
    alert("Quotation submitted!");
  };

  const filteredRows = rows.filter((row) =>
    row.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className={styles.pageTitle} style={{ marginBottom: "10px" }}>
        <h1>Quotation</h1>
      </div>

      <Grid container sx={{ background: "#fff", padding: "20px" }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid item xs={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography as="h5" sx={TypographyHeadingStyles}>
                Customer Name
              </Typography>
              <Autocomplete
                freeSolo
                options={savedCustomerNames}
                value={customerName}
                onInputChange={(event, newInputValue) => {
                  setCustomerName(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    sx={{ width: "300px" }}
                    fullWidth
                  />
                )}
              />
            </Box>

            <Box display="flex" alignItems="center" mb={2}>
              <Typography as="h5" sx={TypographyHeadingStyles}>
                Date
              </Typography>
              <DatePicker
                renderInput={(params) => (
                  <TextField {...params} size="small" sx={{ width: "300px" }} fullWidth />
                )}
              />
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box display="flex" justifyContent="5px" alignItems="" mb={2}>
              <Typography as="h5" sx={TypographyHeadingStyles}>
                Bill To
              </Typography>

              <Box display="flex" flexDirection="column" gap={1}>
                <TextField size="small" 
                placeholder="" 
                sx={{ width: "300px" }} 
                fullWidth />

                <TextField size="small" 
                placeholder="line 1" 
                sx={{ width: "300px" }} 
                fullWidth />

                <TextField size="small" 
                placeholder="line 2" 
                sx={{ width: "300px" }} 
                fullWidth />

                <TextField size="small" 
                placeholder="line 3" 
                sx={{ width: "300px" }} 
                fullWidth />
              </Box>
            </Box>
          </Grid>
        </LocalizationProvider>

        <Grid container sx={{ background: "#fff", padding: "20px" }}>
        <Grid item xs={12} mb={2}>
          <TextField
            label="Search..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TableContainer sx={{ background: "#fff", padding: "10px", marginTop: "10px" }}>
            <Table size="small" aria-label="Quotation Table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: "15px", fontWeight: "bold" }}>Item</TableCell>
                  <TableCell sx={{ fontSize: "15px", fontWeight: "bold" }}>Quantity</TableCell>
                  <TableCell sx={{ fontSize: "15px", fontWeight: "bold" }}>Description</TableCell>
                  <TableCell sx={{ fontSize: "15px", fontWeight: "bold" }}>Unit Price (Rs)</TableCell>
                  <TableCell sx={{ fontSize: "15px", fontWeight: "bold" }}>Discount</TableCell>
                  <TableCell sx={{ fontSize: "15px", fontWeight: "bold" }}>Discounted Price (Rs)</TableCell>
                  <TableCell sx={{ fontSize: "15px", fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <TextField
                        value={row.item}
                        onChange={(e) => handleInputChange(row.id, "item", e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.quantity}
                        onChange={(e) => handleInputChange(row.id, "quantity", e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.description}
                        onChange={(e) => handleInputChange(row.id, "description", e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.unitPrice}
                        onChange={(e) => handleInputChange(row.id, "unitPrice", e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                  <TextField
                    value={row.discount}
                    onChange={(e) => handleInputChange(row.id, "discount", e.target.value)}
                    size="small"
                    fullWidth
                    error={!!error[row.id]}
                    helperText={error[row.id]}
                  />
                </TableCell>
                    <TableCell>
                      <TextField
                        value={row.discountedPrice}
                        size="small"
                        fullWidth
                        disabled
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" justifyContent="center">
                      <IconButton onClick={() => handleDeleteRow(row.id)}>
                        <Delete color="error" />
                      </IconButton>
                      <IconButton onClick={handleAddRow}>
                        <Add color="primary" />
                      </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          

          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ float: "right", margin: "10px" }}
          >
            Submit
          </Button>
        </Grid>
      </Grid>
      </Grid>
      
    </>
  );
};

export default EditableTable;

import React from "react";
import Grid from "@mui/material/Grid";
import {
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatCurrency } from "@/components/utils/formatHelper";

const AddOutletItem = ({ rows, onChange, onDelete }) => {
    if (!rows.length) return null;
    const handleChange = (index, field, value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        const qty = parseFloat(updatedRows[index].qty || 0);
        const price = parseFloat(updatedRows[index].sellingPrice || 0);
        if (field === "value") {
            const cst = parseFloat(updatedRows[index].prevCost) / parseFloat(updatedRows[index].uomValue);
            const cost = parseFloat(cst) * parseFloat(value);
            updatedRows[index].costPrice = cost;
        }
        updatedRows[index].total = (qty * price).toFixed(2);
        onChange(updatedRows);
    };

    return (
        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, md: 1 }}>
            <Grid item xs={12}>
                <Typography variant="h6" my={2}>
                    Outlet Items
                </Typography>
                <TableContainer component={Paper}>
                    <Table size="small" className="dark-table">
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell> Available Value</TableCell>
                                <TableCell>Value</TableCell>
                                <TableCell>Cost Price</TableCell>
                                <TableCell>Selling Price</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        {row.productName || row.name}
                                    </TableCell>
                                    <TableCell>
                                        {row.currentQuantityValue}
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={row.value}
                                            fullWidth
                                            inputProps={{
                                                min: 0,
                                                max: row.currentQuantityValue,
                                            }}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (val <= row.currentQuantityValue) {
                                                    handleChange(index, "value", e.target.value);
                                                }
                                            }}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        {formatCurrency(parseFloat(row.costPrice))}
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            value={row.sellingPrice}
                                            onChange={(e) => handleChange(index, "sellingPrice", e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => onDelete(index)}
                                        >
                                            <DeleteIcon color="error" fontSize="inherit" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        </Grid>
    );
};

export default AddOutletItem;

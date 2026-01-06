import React, { useEffect, useState } from "react";
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
    Paper,
    Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import DeleteIcon from "@mui/icons-material/Delete";
import styles from "@/styles/PageTitle.module.css";

const TypographyHeadingStyles = {
    fontWeight: "500",
    fontSize: "14px",
    mt: "15px",
};
const TypographyDataStyles = {
    fontSize: "14px",
    mt: "15px",
};

const EditableTable = () => {
    const [rows, setRows] = useState([
        {
            id: 1,
            productName: "",
            category: "",
            batch: "",
            exp: null,
            qty: "",
            status: "",
            remark: "",
        },
    ]);

    const handleInputChange = (id, field, value) => {
        setRows((prevRows) =>
            prevRows.map((row) =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    };

    const handleDeleteRow = (id) => {
        setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    };

    const handleAddRow = () => {
        setRows((prevRows) => [
            ...prevRows,
            {
                id: prevRows.length + 1,
                productName: "",
                category: "",
                batch: "",
                exp: null,
                qty: "",
                status: "",
                remark: "",
            },
        ]);
    };

    return (
        <>
            <div className={styles.pageTitle}>
                <h1>Goods Receive Notes</h1>
            </div>
            <Grid container sx={{ background: "#fff" }}>
                <Grid item xs={6} px={2} pt={2} pb={2}>
                    <Box display="flex" justifyContent="space-between">
                        <Typography as="h5" sx={TypographyHeadingStyles}>
                            Customer Name
                        </Typography>
                        <Typography as="h5" sx={TypographyDataStyles}>
                            MAC DONALS
                        </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between">
                        <Typography as="h5" sx={TypographyHeadingStyles}>
                            GRN Date
                        </Typography>
                        <Typography as="h5" sx={TypographyDataStyles}>
                            4-05-2024
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} px={2} pt={2} pb={2}>
                    <Box display="flex" justifyContent="space-between">
                        <Typography as="h5" sx={TypographyHeadingStyles}>
                            Reference code
                        </Typography>
                        <Typography as="h5" sx={TypographyDataStyles}>
                            153362
                        </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                        <Typography as="h5" sx={TypographyHeadingStyles}>
                            Remark
                        </Typography>
                        <Typography as="h5" sx={TypographyDataStyles}>
                            Delivered
                        </Typography>
                    </Box>
                </Grid>

                <Grid item xs={12} mb={3} px={2}>
                    <Divider sx={{ mb: 2 }} />

                    <Typography color="primary" variant="h5" mt={2} mb={2}>
                        GRN Entries
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <TableContainer component={Paper}>
                            <Table
                                size="small"
                                aria-label="simple table"
                                className="dark-table"
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Product Name</TableCell>
                                        <TableCell>Category</TableCell>
                                        <TableCell>Batch</TableCell>
                                        <TableCell>EXP</TableCell>
                                        <TableCell>Qty</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Remark</TableCell>
                                        <TableCell>Delete</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            sx={{ height: 60 }}
                                        >
                                            <TableCell>
                                                <TextField
                                                    value={row.productName}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            row.id,
                                                            "productName",
                                                            e.target.value
                                                        )
                                                    }
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    value={row.category}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            row.id,
                                                            "category",
                                                            e.target.value
                                                        )
                                                    }
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    value={row.batch}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            row.id,
                                                            "batch",
                                                            e.target.value
                                                        )
                                                    }
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <DatePicker
                                                    value={row.exp}
                                                    onChange={(date) =>
                                                        handleInputChange(
                                                            row.id,
                                                            "exp",
                                                            date
                                                        )
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            fullWidth
                                                        />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    value={row.qty}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            row.id,
                                                            "qty",
                                                            e.target.value
                                                        )
                                                    }
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    value={row.status}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            row.id,
                                                            "status",
                                                            e.target.value
                                                        )
                                                    }
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    value={row.remark}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            row.id,
                                                            "remark",
                                                            e.target.value
                                                        )
                                                    }
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    onClick={() =>
                                                        handleDeleteRow(row.id)
                                                    }
                                                >
                                                    <DeleteIcon color="error" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Button
                                onClick={handleAddRow}
                                variant="contained"
                                style={{ float: "right", margin: "10px" }}
                            >
                                Add Row
                            </Button>
                        </TableContainer>
                    </LocalizationProvider>
                </Grid>
            </Grid>
        </>
    );
};

export default EditableTable;

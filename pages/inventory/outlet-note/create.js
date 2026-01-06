import React, { useEffect, useRef, useState } from "react";
import { Grid, Paper, Radio, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import "react-toastify/dist/ReactToastify.css";
import SearchItemByName from "@/components/utils/SearchItemByName";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import GetAllSuppliers from "@/components/utils/GetAllSuppliers";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  AddedQuantity: Yup.number()
    .typeError("Qty must be a number")
    .required("Qty is required")
    .moreThan(0, "Qty must be greater than 0"),
});

export default function AddOutlet({ fetchItems, isExpDateAvailable, isBatchAvailable }) {
  const [open, setOpen] = React.useState(false);
  const [openSecond, setOpenSecond] = useState(false);
  const [selected, setSelected] = useState();
  const [addedQuantityValue, setAddedQuantityValue] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [stock, setStock] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const { data: supplierList } = GetAllSuppliers();
  const [supplierInfo, setSupplierInfo] = useState({});

  useEffect(() => {
    if (supplierList) {
      const supplierMap = supplierList.reduce((acc, supplier) => {
        acc[supplier.id] = supplier;
        return acc;
      }, {});
      setSupplierInfo(supplierMap);
    }
  }, [supplierList]);

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
  };
  const handleSecondClose = () => setOpenSecond(false);
  const searchRef = useRef(null);

  const handleOpen = async () => {
    setOpen(true);
  };
  const handleAddItem = async (item) => {
    if (!item) {
      item = stock[0];
    }
    setSelectedItem(item);
    setOpenSecond(false);
    setAddedQuantityValue(0);
  };
  const handleSelect = (item, index) => {
    setSelected(item);
    setSelectedIndex(index);
  };

  const handleCalcQuantityValue = (value) => {
    const val = parseFloat(selectedItem.uomValue || 0) * parseFloat(value);
    setAddedQuantityValue(val);
  }

  const handleItemStock = async (item) => {
    try {
      const query = `${BASE_URL}/Items/GetStockBalanceForOutLet?itemId=${item.id}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setStock(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
    setOpenSecond(true);

  }

  const handleSubmit = (values) => {
    const data = {
      StockBalanceId: selectedItem?.stockBalanceId,
      SequenceNumber: selectedItem?.sequenceNumber,
      ProductId: selectedItem?.productId,
      ProductCode: selectedItem?.productCode,
      ProductName: selectedItem?.name,
      WarehouseId: selectedItem?.warehouseId,
      BatchNumber: selectedItem?.batchNumber,
      ExpiryDate: selectedItem?.expiryDate,
      AddedQuantity: parseFloat(values.AddedQuantity),
      AddedQuantityValue: addedQuantityValue,
      CurrentQuantityValue: selectedItem?.currentQuantityValue,
      CostPrice: selectedItem?.costPrice,
      SellingPrice: selectedItem?.sellingPrice,
      SupplierID: selectedItem?.supplierID,
      SupplierName: supplierInfo[selectedItem?.supplierID]?.name || "-",
    };
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/Outlet/AddOutletStock`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          setOpen(false);
          setSelectedItem(null);
          setAddedQuantityValue(0);
          fetchItems();
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + add new
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              StockBalanceId: selectedItem?.stockBalanceId ?? null,
              SequenceNumber: selectedItem?.sequenceNumber ?? null,
              ProductId: selectedItem?.productId ?? 0,
              ProductCode: selectedItem?.productCode ?? null,
              ProductName: selectedItem?.name ?? null,
              WarehouseId: selectedItem?.warehouseId ?? null,
              BatchNumber: selectedItem?.batchNumber ?? null,
              ExpiryDate: selectedItem?.expiryDate ?? null,
              AddedQuantity: 0,
              AddedQuantityValue: addedQuantityValue || 0,
              CurrentQuantityValue: selectedItem?.currentQuantityValue ?? null,
              CostPrice: selectedItem?.costPrice ?? null,
              SellingPrice: selectedItem?.sellingPrice ?? null,
              SupplierID: selectedItem?.supplierID ?? null,
              SupplierName: selectedItem?.supplierName ?? null,
              UOMValue: selectedItem?.uomValue ?? null
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, resetForm }) => (
              <Form>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Add Outlet
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ height: "50vh", overflowY: "scroll" }}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} mt={2}>
                          <SearchItemByName
                            ref={searchRef}
                            label="Search"
                            placeholder="Search Item by name"
                            fetchUrl={`${BASE_URL}/Items/GetAllItemsWithoutZeroQty`}
                            onSelect={(item) => {
                              handleItemStock(item);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              mb: "5px",
                            }}
                          >
                            Product Name
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            value={selectedItem?.name ?? null}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              mb: "5px",
                            }}
                          >
                            UOM Value
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            value={selectedItem?.uomValue ?? null}
                            size="small"
                            name="UOMValue"
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              mb: "5px",
                            }}
                          >
                            Available Qty
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            value={selectedItem?.currentQuantityValue ?? null}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              mb: "5px",
                            }}
                          >
                            Added Quantity
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name="AddedQuantity"
                            size="small"
                            error={touched.AddedQuantity && Boolean(errors.AddedQuantity)}
                            helperText={touched.AddedQuantity && errors.AddedQuantity}
                            onChange={(e) => {
                              if (selectedItem && !selectedItem.uomValue) {
                                toast.info("UOM Value is Required");
                                return;
                              }
                              setFieldValue('AddedQuantity', e.target.value);
                              handleCalcQuantityValue(e.target.value);
                            }
                            }
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: "500",
                              mb: "5px",
                            }}
                          >
                            Added Quantity Value
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name="AddedQuantityValue"
                            value={addedQuantityValue}
                            disabled
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                  <Grid container>
                    <Grid
                      display="flex"
                      justifyContent="space-between"
                      item
                      xs={12}
                      p={1}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        onClick={handleClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" size="small">
                        Save
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>

      <Modal
        open={openSecond}
        onClose={handleSecondClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>

            {stock.length > 0 ?
              <>
                <Typography sx={{ fontWeight: "bold", my: 2, fontSize: "1.2rem" }}>
                  {stock[0].name}
                </Typography>
                <Typography sx={{ fontWeight: "500", my: 1, fontSize: "1rem" }}>
                  Cat. - {stock[0].category} / Sb. Cat. - {stock[0].subCategory}
                </Typography>
                <Typography sx={{ fontWeight: "500", my: 1, mb: 2, fontSize: "1rem" }}>
                  UOM - {stock[0].uom} / UOM Val. {stock[0].uomValue}
                </Typography>
              </> : <Typography sx={{ fontWeight: "500", my: 2, fontSize: "1rem" }}>
                Stock Balance
              </Typography>}

            <TableContainer component={Paper} sx={{ height: '50vh', overflowY: 'scroll' }}>
              <Table
                size="small"
                aria-label="simple table"
                className="dark-table"
              >
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    {isBatchAvailable && (
                      <TableCell>Batch</TableCell>
                    )}
                    {isExpDateAvailable && (
                      <TableCell>Exp Date</TableCell>
                    )}

                    <TableCell>Cost Price</TableCell>
                    <TableCell>Selling Price</TableCell>
                    <TableCell>Available Qty</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stock
                    .sort(
                      (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
                    )
                    .map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        {isBatchAvailable && (
                          <TableCell>{item.batchNumber}</TableCell>
                        )}
                        {isExpDateAvailable && (
                          <TableCell>{item.expiryDate}</TableCell>
                        )}
                        <TableCell>{item.costPrice}</TableCell>
                        <TableCell>{item.sellingPrice}</TableCell>
                        <TableCell>{item.currentQuantityValue}</TableCell>
                        <TableCell>
                          <Radio
                            name="stockSelection"
                            onChange={() => handleSelect(item, index)}
                            value={item.id}
                            checked={selectedIndex === index}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box display="flex" mt={3} justifyContent="space-between">
            <Button variant="outlined" onClick={handleSecondClose}>
              <Typography sx={{ fontWeight: "bold" }}>Cancel</Typography>
            </Button>
            <Button
              variant="contained"
              disabled={stock.length === 0}
              onClick={() => handleAddItem(selected)}
            >
              <Typography sx={{ fontWeight: "bold" }}>Add</Typography>
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

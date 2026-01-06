import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Table,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
  Modal,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CachedIcon from "@mui/icons-material/Cached";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AddGSM from "@/components/UIElements/Modal/AddGSM";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
import AddComposition from "@/components/UIElements/Modal/AddComposition";
import AddSupplier from "pages/master/supplier/AddSupplier";
import AddColor from "@/components/UIElements/Modal/AddColor";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};
const hover = {
  transition: "0.5s",
  "&:hover": {
    backgroundColor: "#e5e5e5",
    cursor: "pointer",
  },
};

export default function SelectFabric() {
  const [openGSM, setOpenGSM] = useState(false);
  const [gsmList, setGSMList] = useState([]);
  const [selectedGSMIndex, setSelectedGSMIndex] = useState(null);

  const [openComposition, setOpenComposition] = useState(false);
  const [compositionList, setCompositionList] = useState([]);
  const [selectedCompositionIndex, setSelectedCompositionIndex] =
    useState(null);

  const [openSupplier, setOpenSupplier] = useState(false);
  const [supplierList, setSupplierList] = useState([]);
  const [selectedSupplierIndex, setSelectedSupplierIndex] = useState(null);

  const [openColor, setOpenColor] = useState(false);
  const [colorList, setColorList] = useState([]);
  const [selectedColorIndex, setSelectedColorIndex] = useState(null);

  const [selectedFabricIndex, setSelectedFabricIndex] = useState(null);
  const router = useRouter();
  const inqType = router.query.inqType;
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const inquiryDetails = JSON.parse(localStorage.getItem("InquiryDetails"));
  const customerName = inquiryDetails.customerName;
  const optionName = optionDetails.optionName;
  const [fabList, setFabList] = useState([]);

  const handleGSMOpen = (index) => {
    setOpenGSM(true);
    setSelectedFabricIndex(index);
  };

  const handleCompositionOpen = (index) => {
    setOpenComposition(true);
    setSelectedFabricIndex(index);
  };

  const handleSupplierOpen = (index) => {
    setOpenSupplier(true);
    setSelectedFabricIndex(index);
  };

  const handleColorOpen = (index) => {
    setOpenColor(true);
    setSelectedFabricIndex(index);
  };

  const handleGSMClose = () => {
    setOpenGSM(false);
  };
  const handleSupplierClose = () => {
    setOpenSupplier(false);
  };
  const handleColorClose = () => {
    setOpenColor(false);
  };
  const handleCompositionClose = () => {
    setOpenComposition(false);
  };

  const handleGSMSelection = (index) => {
    setSelectedGSMIndex(index);
    const selectedFab = fabList[selectedFabricIndex];
    const selectedGSM = gsmList[index];
    const requestBody = {
      InquiryID: inquiryDetails.id,
      InqCode: inquiryDetails.inqCode,
      OptionId: optionDetails.id,
      FabricId: selectedFab.fabricId,
      WindowType: optionDetails.windowType,
      ColorCodeId:
        selectedFab.colorCodeId === null ? 0 : selectedFab.colorCodeId,
      ColorCodeName: selectedFab.colorCodeName,
      CompositionId:
        selectedFab.compositionId === null ? 0 : selectedFab.compositionId,
      CompositionName: selectedFab.compositionName,
      GSMId: selectedGSM.id,
      GSMName: selectedGSM.name,
      SupplierId: selectedFab.supplierId === null ? 0 : selectedFab.supplierId,
      SupplierName: selectedFab.supplierName,
    };

    fetch(`${BASE_URL}/Inquiry/UpdateInquiryFabric`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setOpenGSM(false);
        fetchFabricList();
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  const handleCompositionSelection = (index) => {
    setSelectedCompositionIndex(index);
    const selectedFab = fabList[selectedFabricIndex];
    const selectedComposition = compositionList[index];
    const requestBody = {
      InquiryID: inquiryDetails.id,
      InqCode: inquiryDetails.inqCode,
      OptionId: optionDetails.id,
      FabricId: selectedFab.fabricId,
      WindowType: optionDetails.windowType,
      ColorCodeId:
        selectedFab.colorCodeId === null ? 0 : selectedFab.colorCodeId,
      ColorCodeName: selectedFab.colorCodeName,
      CompositionId: selectedComposition.id,
      CompositionName: selectedComposition.name,
      GSMId: selectedFab.gsmId === null ? 0 : selectedFab.gsmId,
      GSMName: selectedFab.gsmName,
      SupplierId: selectedFab.supplierId === null ? 0 : selectedFab.supplierId,
      SupplierName: selectedFab.supplierName,
    };

    fetch(`${BASE_URL}/Inquiry/UpdateInquiryFabric`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        fetchFabricList();
        setOpenComposition(false);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  const handleSupplierSelection = (index) => {
    setSelectedSupplierIndex(index);
    const selectedFab = fabList[selectedFabricIndex];
    const selectedSupplier = supplierList[index];
    const requestBody = {
      InquiryID: inquiryDetails.id,
      InqCode: inquiryDetails.inqCode,
      OptionId: optionDetails.id,
      FabricId: selectedFab.fabricId,
      WindowType: optionDetails.windowType,
      ColorCodeId:
        selectedFab.colorCodeId === null ? 0 : selectedFab.colorCodeId,
      ColorCodeName: selectedFab.colorCodeName,
      CompositionId:
        selectedFab.compositionId === null ? 0 : selectedFab.compositionId,
      CompositionName: selectedFab.compositionName,
      GSMId: selectedFab.gsmId === null ? 0 : selectedFab.gsmId,
      GSMName: selectedFab.gsmName,
      SupplierId: selectedSupplier.id,
      SupplierName: selectedSupplier.name,
    };

    fetch(`${BASE_URL}/Inquiry/UpdateInquiryFabric`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        fetchFabricList();
        setOpenSupplier(false);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  const handleColorSelection = (index) => {
    setSelectedColorIndex(index);
    const selectedFab = fabList[selectedFabricIndex];
    const selectedColor = colorList[index];
    const requestBody = {
      InquiryID: inquiryDetails.id,
      InqCode: inquiryDetails.inqCode,
      OptionId: optionDetails.id,
      FabricId: selectedFab.fabricId,
      WindowType: optionDetails.windowType,
      ColorCodeId: selectedColor.id,
      ColorCodeName: selectedColor.name,
      CompositionId:
        selectedFab.compositionId === null ? 0 : selectedFab.compositionId,
      CompositionName: selectedFab.compositionName,
      GSMId: selectedFab.gsmId === null ? 0 : selectedFab.gsmId,
      GSMName: selectedFab.gsmName,
      SupplierId: selectedFab.supplierId === null ? 0 : selectedFab.supplierId,
      SupplierName: selectedFab.supplierName,
    };

    fetch(`${BASE_URL}/Inquiry/UpdateInquiryFabric`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        fetchFabricList();
        setOpenColor(false);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  const handleReloadRow = (index) => {
    const selectedFab = fabList[index];

    const requestBody = {
      InquiryID: inquiryDetails.id,
      InqCode: inquiryDetails.inqCode,
      OptionId: optionDetails.id,
      FabricId: selectedFab.fabricId,
      WindowType: optionDetails.windowType,
      ColorCodeId: 0,
      ColorCodeName: "",
      CompositionId: 0,
      CompositionName: "",
      GSMId: 0,
      GSMName: "",
      SupplierId: 0,
      SupplierName: "",
    };

    fetch(`${BASE_URL}/Inquiry/UpdateInquiryFabric`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        window.location.reload();
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  const fetchGSMList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/GSM/GetAllGSM`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch GSM List");
      }

      const data = await response.json();
      setGSMList(data.result);
    } catch (error) {
      console.error("Error fetching GSM List:", error);
    }
  };

  const fetchCompositionList = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Composition/GetAllComposition`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Composition List");
      }

      const data = await response.json();
      setCompositionList(data.result);
    } catch (error) {
      console.error("Error fetching Composition List:", error);
    }
  };

  const fetchSupplierList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Supplier/GetAllSupplier`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Supplier List");
      }

      const data = await response.json();
      setSupplierList(data.result);
    } catch (error) {
      console.error("Error fetching Supplier List:", error);
    }
  };

  const fetchColorList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/ColorCode/GetAllColorCode`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Color Code List");
      }

      const data = await response.json();
      setColorList(data.result);
    } catch (error) {
      console.error("Error fetching Color Code List:", error);
    }
  };

  useEffect(() => {
    fetchGSMList();
    fetchCompositionList();
    fetchSupplierList();
    fetchColorList();
  }, []);

  const fetchFabricList = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquiryFabric?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Value List");
      }

      const data = await response.json();
      setFabList(data.result);
    } catch (error) {
      console.error("Error fetching Value List:", error);
    }
  };

  useEffect(() => {
    fetchFabricList();
  }, []);

  return (
    <>
      <ToastContainer />

      <DashboardHeader
        customerName={customerName}
        optionName={optionName}
        href="/inquiry/inquries/"
        link="Inquiries"
        title="Color Code"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Color Code</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Link href={`/inquiry/select-fabric/?inqType=${inqType}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Link href="/inquiry/select-inquiry/">
              <Button variant="outlined" color="primary">
                main menu
              </Button>
            </Link>
            <Link href={`/inquiry/sizes/?inqType=${inqType}`}>
              <Button
                variant="outlined"
                color="primary"
                endIcon={<NavigateNextIcon />}
              >
                next
              </Button>
            </Link>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1}>
              <TableContainer component={Paper}>
                <Table aria-label="simple table" className="dark-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Fabric</TableCell>
                      <TableCell align="center">GSM</TableCell>
                      <TableCell align="center">Composition</TableCell>
                      <TableCell align="center">Supplier</TableCell>
                      <TableCell align="center">Color Code</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fabList.length === 0 ? (
                      <TableRow
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell colSpan={3} component="th" scope="row">
                          <Typography color="error">
                            Fabric is not selected
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      fabList.map((fab, index) => (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {index + 1}
                          </TableCell>
                          <TableCell>{fab.fabricName}</TableCell>
                          <TableCell align="center">
                            <Button onClick={() => handleGSMOpen(index)}>
                              {selectedFabricIndex === index &&
                              selectedGSMIndex !== null
                                ? gsmList[selectedGSMIndex].name
                                : fab.gsmName
                                ? fab.gsmName
                                : "Not Selected"}
                            </Button>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              onClick={() => handleCompositionOpen(index)}
                            >
                              {selectedFabricIndex === index &&
                              selectedCompositionIndex !== null
                                ? compositionList[selectedCompositionIndex].name
                                : fab.compositionName
                                ? fab.compositionName
                                : "Not Selected"}
                            </Button>
                          </TableCell>
                          <TableCell align="center">
                            <Button onClick={() => handleSupplierOpen(index)}>
                              {selectedFabricIndex === index &&
                              selectedSupplierIndex !== null
                                ? supplierList[selectedSupplierIndex].name
                                : fab.supplierName
                                ? fab.supplierName
                                : "Not Selected"}
                            </Button>
                          </TableCell>
                          <TableCell align="center">
                            <Button onClick={() => handleColorOpen(index)}>
                              {selectedFabricIndex === index &&
                              selectedColorIndex !== null
                                ? colorList[selectedColorIndex].name
                                : fab.colorCodeName
                                ? fab.colorCodeName
                                : "Not Selected"}
                            </Button>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Reload" placement="top">
                              <IconButton
                                onClick={() => handleReloadRow(index)}
                                aria-label="delete"
                              >
                                <CachedIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip
                              sx={{ marginLeft: "7px" }}
                              title="Delete"
                              placement="top"
                            >
                              <IconButton aria-label="delete">
                                <DeleteIcon color="error" fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* GSM */}
      <Modal
        open={openGSM}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        onClose={handleGSMClose}
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={12} mt={2}>
                <AddGSM fetchItems={fetchGSMList} />
              </Grid>
              <Grid item xs={12} mt={2} sx={{maxHeight: '50vh',overflowY: 'scroll'}}>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" size="small" className="dark-table">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>GSM</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gsmList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} component="th" scope="row">
                            <Typography color="error">
                              No GSM Available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        gsmList.map((gsm, index) => (
                          <TableRow
                            key={index}
                            onClick={() => handleGSMSelection(index)}
                            sx={hover}
                          >
                            <TableCell component="th" scope="row">
                              {index + 1}
                            </TableCell>
                            <TableCell>{gsm.name}</TableCell>
                            <TableCell align="right">
                              {gsm.isActive ? (
                                <span className="successBadge">Active</span>
                              ) : (
                                <span className="dangerBadge">Inactive</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Button
                variant="contained"
                color="error"
                onClick={handleGSMClose}
                sx={{
                  mt: 2,
                  textTransform: "capitalize",
                  borderRadius: "8px",
                  fontWeight: "500",
                  fontSize: "13px",
                  padding: "12px 20px",
                }}
              >
                Cancel
              </Button>
            </Grid>
          </Box>
        </Box>
      </Modal>

      {/* Composition */}
      <Modal
        open={openComposition}
        onClose={handleCompositionClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={12} mt={2}>
                <AddComposition fetchItems={fetchCompositionList} />
              </Grid>
              <Grid item xs={12} mt={2} sx={{maxHeight: '50vh',overflowY: 'scroll'}}>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" size="small" className="dark-table">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Composition</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {compositionList.length === 0 ? (
                        <TableRow
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell colSpan={3} component="th" scope="row">
                            <Typography color="error">
                              No Compositions Available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        compositionList.map((composition, index) => (
                          <TableRow
                            key={index}
                            onClick={() => handleCompositionSelection(index)}
                            sx={hover}
                          >
                            <TableCell component="th" scope="row">
                              {index + 1}
                            </TableCell>
                            <TableCell>{composition.name}</TableCell>
                            <TableCell align="right">
                              {composition.isActive == true ? (
                                <span className="successBadge">Active</span>
                              ) : (
                                <span className="dangerBadge">Inctive</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Button
                variant="contained"
                color="error"
                onClick={handleCompositionClose}
                sx={{
                  mt: 2,
                  textTransform: "capitalize",
                  borderRadius: "8px",
                  fontWeight: "500",
                  fontSize: "13px",
                  padding: "12px 20px",
                }}
              >
                Cancel
              </Button>
            </Grid>
          </Box>
        </Box>
      </Modal>

      {/* Supplier */}
      <Modal
        open={openSupplier}
        onClose={handleSupplierClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={12} mt={2}>
                <AddSupplier fetchItems={fetchSupplierList} />
              </Grid>
              <Grid item xs={12} mt={2} sx={{maxHeight: '50vh',overflowY: 'scroll'}}>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" size="small" className="dark-table">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Supplier</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {supplierList.length === 0 ? (
                        <TableRow
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell colSpan={3} component="th" scope="row">
                            <Typography color="error">
                              No Suppliers Available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        supplierList.map((supplier, index) => (
                          <TableRow
                            key={index}
                            onClick={() => handleSupplierSelection(index)}
                            sx={hover}
                          >
                            <TableCell component="th" scope="row">
                              {index + 1}
                            </TableCell>
                            <TableCell>{supplier.name}</TableCell>
                            <TableCell align="right">
                              {supplier.isActive == true ? (
                                <span className="successBadge">Active</span>
                              ) : (
                                <span className="dangerBadge">Inctive</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Button
                variant="contained"
                color="error"
                onClick={handleSupplierClose}
                sx={{
                  mt: 2,
                  textTransform: "capitalize",
                  borderRadius: "8px",
                  fontWeight: "500",
                  fontSize: "13px",
                  padding: "12px 20px",
                }}
              >
                Cancel
              </Button>
            </Grid>
          </Box>
        </Box>
      </Modal>

      {/* Color */}
      <Modal
        open={openColor}
        onClose={handleColorClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={12} mt={2}>
                <AddColor fetchItems={fetchColorList} />
              </Grid>
              <Grid item xs={12} mt={2} sx={{maxHeight: '50vh',overflowY: 'scroll'}}>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" size="small" className="dark-table">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Color</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {colorList.length === 0 ? (
                        <TableRow
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell colSpan={3} component="th" scope="row">
                            <Typography color="error">
                              No Color Codes Available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        colorList.map((color, index) => (
                          <TableRow
                            key={index}
                            onClick={() => handleColorSelection(index)}
                            sx={hover}
                          >
                            <TableCell component="th" scope="row">
                              {index + 1}
                            </TableCell>
                            <TableCell>{color.name}</TableCell>
                            <TableCell align="right">
                              {color.isActive == true ? (
                                <span className="successBadge">Active</span>
                              ) : (
                                <span className="dangerBadge">Inctive</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Button
                variant="contained"
                color="error"
                onClick={handleColorClose}
                sx={{
                  mt: 2,
                  textTransform: "capitalize",
                  borderRadius: "8px",
                  fontWeight: "500",
                  fontSize: "13px",
                  padding: "12px 20px",
                }}
              >
                Cancel
              </Button>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

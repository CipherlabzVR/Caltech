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
  Checkbox,
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

export default function EditColorCode() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);

  const [openGSM, setOpenGSM] = useState(false);
  const [gsmList, setGSMList] = useState([]);
  const [selectedGSMIndices, setSelectedGSMIndices] = useState([]);

  const [openComposition, setOpenComposition] = useState(false);
  const [compositionList, setCompositionList] = useState([]);
  const [selectedCompositionIndices, setSelectedCompositionIndices] = useState([]);

  const [openSupplier, setOpenSupplier] = useState(false);
  const [supplierList, setSupplierList] = useState([]);
  const [selectedSupplierIndices, setSelectedSupplierIndices] = useState([]);

  const [openColor, setOpenColor] = useState(false);
  const [colorList, setColorList] = useState([]);
  const [selectedColorIndices, setSelectedColorIndices] = useState([]);

  const [selectedFabricIndex, setSelectedFabricIndex] = useState(null);
  const [fabList, setFabList] = useState([]);

  // Parse comma-separated names string into set of trimmed names
  const parseNames = (str) => {
    if (!str || str === "Not Selected") return new Set();
    return new Set(str.split(",").map((s) => s.trim()).filter(Boolean));
  };
  // Initialize modal selection from fabric's comma-separated names
  const getIndicesFromNames = (list, namesStr) => {
    const names = parseNames(namesStr);
    if (names.size === 0) return [];
    return list
      .map((item, idx) => (names.has((item && item.name) ? item.name.trim() : "") ? idx : -1))
      .filter((i) => i >= 0);
  };

  const fetchInquiryById = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Inquiry/GetInquiryByInquiryId?id=${inqId}&optId=${optId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Fabric List");
      }

      const data = await response.json();
      const inq = data.result;
      setInquiry(inq);
      fetchFabricList(inq.inquiryId, inq.optionId, inq.windowType);
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  useEffect(() => {
    if (inqId && optId) {
      fetchInquiryById();
    }
  }, [inqId, optId]);

  const handleGSMOpen = (index) => {
    setSelectedFabricIndex(index);
    const fab = fabList[index];
    setSelectedGSMIndices(getIndicesFromNames(gsmList, fab?.gsmName || ""));
    setOpenGSM(true);
  };

  const handleCompositionOpen = (index) => {
    setSelectedFabricIndex(index);
    const fab = fabList[index];
    setSelectedCompositionIndices(getIndicesFromNames(compositionList, fab?.compositionName || ""));
    setOpenComposition(true);
  };

  const handleSupplierOpen = (index) => {
    setSelectedFabricIndex(index);
    const fab = fabList[index];
    setSelectedSupplierIndices(getIndicesFromNames(supplierList, fab?.supplierName || ""));
    setOpenSupplier(true);
  };

  const handleColorOpen = (index) => {
    setSelectedFabricIndex(index);
    const fab = fabList[index];
    setSelectedColorIndices(getIndicesFromNames(colorList, fab?.colorCodeName || ""));
    setOpenColor(true);
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

  const toggleGSMSelection = (index) => {
    setSelectedGSMIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleGSMApply = () => {
    const selectedFab = fabList[selectedFabricIndex];
    const selectedItems = selectedGSMIndices.map((i) => gsmList[i]).filter(Boolean);
    const names = selectedItems.map((x) => x.name).join(", ");
    const firstId = selectedItems.length > 0 ? selectedItems[0].id : 0;
    const requestBody = {
      InquiryID: inquiry.inquiryId,
      InqCode: inquiry.inquiryCode,
      OptionId: inquiry.optionId,
      FabricId: selectedFab.fabricId,
      WindowType: inquiry.windowType,
      ColorCodeId: selectedFab.colorCodeId === null ? 0 : selectedFab.colorCodeId,
      ColorCodeName: selectedFab.colorCodeName || "",
      CompositionId: selectedFab.compositionId === null ? 0 : selectedFab.compositionId,
      CompositionName: selectedFab.compositionName || "",
      GSMId: firstId,
      GSMName: names,
      SupplierId: selectedFab.supplierId === null ? 0 : selectedFab.supplierId,
      SupplierName: selectedFab.supplierName || "",
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
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then(() => {
        setOpenGSM(false);
        fetchFabricList(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      })
      .catch((error) => console.error("There was a problem with the fetch operation:", error));
  };

  const toggleCompositionSelection = (index) => {
    setSelectedCompositionIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleCompositionApply = () => {
    const selectedFab = fabList[selectedFabricIndex];
    const selectedItems = selectedCompositionIndices.map((i) => compositionList[i]).filter(Boolean);
    const names = selectedItems.map((x) => x.name).join(", ");
    const firstId = selectedItems.length > 0 ? selectedItems[0].id : 0;
    const requestBody = {
      InquiryID: inquiry.inquiryId,
      InqCode: inquiry.inquiryCode,
      OptionId: inquiry.optionId,
      FabricId: selectedFab.fabricId,
      WindowType: inquiry.windowType,
      ColorCodeId: selectedFab.colorCodeId === null ? 0 : selectedFab.colorCodeId,
      ColorCodeName: selectedFab.colorCodeName || "",
      CompositionId: firstId,
      CompositionName: names,
      GSMId: selectedFab.gsmId === null ? 0 : selectedFab.gsmId,
      GSMName: selectedFab.gsmName || "",
      SupplierId: selectedFab.supplierId === null ? 0 : selectedFab.supplierId,
      SupplierName: selectedFab.supplierName || "",
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
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then(() => {
        setOpenComposition(false);
        fetchFabricList(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      })
      .catch((error) => console.error("There was a problem with the fetch operation:", error));
  };

  const toggleSupplierSelection = (index) => {
    setSelectedSupplierIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSupplierApply = () => {
    const selectedFab = fabList[selectedFabricIndex];
    const selectedItems = selectedSupplierIndices.map((i) => supplierList[i]).filter(Boolean);
    const names = selectedItems.map((x) => x.name).join(", ");
    const firstId = selectedItems.length > 0 ? selectedItems[0].id : 0;
    const requestBody = {
      InquiryID: inquiry.inquiryId,
      InqCode: inquiry.inquiryCode,
      OptionId: inquiry.optionId,
      FabricId: selectedFab.fabricId,
      WindowType: inquiry.windowType,
      ColorCodeId: selectedFab.colorCodeId === null ? 0 : selectedFab.colorCodeId,
      ColorCodeName: selectedFab.colorCodeName || "",
      CompositionId: selectedFab.compositionId === null ? 0 : selectedFab.compositionId,
      CompositionName: selectedFab.compositionName || "",
      GSMId: selectedFab.gsmId === null ? 0 : selectedFab.gsmId,
      GSMName: selectedFab.gsmName || "",
      SupplierId: firstId,
      SupplierName: names,
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
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then(() => {
        setOpenSupplier(false);
        fetchFabricList(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      })
      .catch((error) => console.error("There was a problem with the fetch operation:", error));
  };

  const toggleColorSelection = (index) => {
    setSelectedColorIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleColorApply = () => {
    const selectedFab = fabList[selectedFabricIndex];
    const selectedItems = selectedColorIndices.map((i) => colorList[i]).filter(Boolean);
    const names = selectedItems.map((x) => x.name).join(", ");
    const firstId = selectedItems.length > 0 ? selectedItems[0].id : 0;
    const requestBody = {
      InquiryID: inquiry.inquiryId,
      InqCode: inquiry.inquiryCode,
      OptionId: inquiry.optionId,
      FabricId: selectedFab.fabricId,
      WindowType: inquiry.windowType,
      ColorCodeId: firstId,
      ColorCodeName: names,
      CompositionId: selectedFab.compositionId === null ? 0 : selectedFab.compositionId,
      CompositionName: selectedFab.compositionName || "",
      GSMId: selectedFab.gsmId === null ? 0 : selectedFab.gsmId,
      GSMName: selectedFab.gsmName || "",
      SupplierId: selectedFab.supplierId === null ? 0 : selectedFab.supplierId,
      SupplierName: selectedFab.supplierName || "",
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
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then(() => {
        setOpenColor(false);
        fetchFabricList(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      })
      .catch((error) => console.error("There was a problem with the fetch operation:", error));
  };

  const handleReloadRow = (index) => {
    const selectedFab = fabList[index];

    const requestBody = {
      InquiryID: inquiry.inquiryId,
      InqCode: inquiry.inquiryCode,
      OptionId: inquiry.optionId,
      FabricId: selectedFab.fabricId,
      WindowType: inquiry.windowType,
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

  const fetchFabricList = async (inqId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquiryFabric?InquiryID=${inqId}&OptionId=${optionId}&WindowType=${windowType}`,
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

  return (
    <>
      <ToastContainer />

      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        windowType={inquiry ? inquiry.windowType : null}
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
            <Link href={`/inquiry/edit-inquiry/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId : ""}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>            
            <Link href={`/inquiry/edit-inquiry/sizes/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId : ""}`}>
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
                      fabList.map((fab, index) => {
                        const gsmValue = fab.gsmName && fab.gsmName.trim() ? fab.gsmName.trim() : "Not Selected";
                        const compositionValue = fab.compositionName && fab.compositionName.trim() ? fab.compositionName.trim() : "Not Selected";
                        const supplierValue = fab.supplierName && fab.supplierName.trim() ? fab.supplierName.trim() : "Not Selected";
                        const colorValue = fab.colorCodeName && fab.colorCodeName.trim() ? fab.colorCodeName.trim() : "Not Selected";

                        return (
                          <TableRow key={index}>
                            <TableCell component="th" scope="row">
                              {index + 1}
                            </TableCell>
                            <TableCell>{fab.fabricName}</TableCell>
                            <TableCell align="center">
                              <Button color={gsmValue === "Not Selected" ? "inherit" : "primary"} onClick={() => handleGSMOpen(index)}>{gsmValue}</Button>
                            </TableCell>
                            <TableCell align="center">
                              <Button color={compositionValue === "Not Selected" ? "inherit" : "primary"} onClick={() => handleCompositionOpen(index)}>
                                {compositionValue}
                              </Button>
                            </TableCell>
                            <TableCell align="center">
                              <Button color={supplierValue === "Not Selected" ? "inherit" : "primary"} onClick={() => handleSupplierOpen(index)}>
                                {supplierValue}
                              </Button>
                            </TableCell>
                            <TableCell align="center">
                              <Button color={colorValue === "Not Selected" ? "inherit" : "primary"} onClick={() => handleColorOpen(index)}>
                                {colorValue}
                              </Button>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Reload" placement="top">
                                <IconButton
                                  onClick={() => handleReloadRow(index)}
                                  aria-label="reload"
                                >
                                  <CachedIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
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
              <Grid item xs={12} mt={2} sx={{ maxHeight: '50vh', overflowY: 'scroll' }}>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" size="small" className="dark-table">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">Select</TableCell>
                        <TableCell>#</TableCell>
                        <TableCell>GSM</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gsmList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} component="th" scope="row">
                            <Typography color="error">
                              No GSM Available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        gsmList.map((gsm, index) => (
                          <TableRow
                            key={index}
                            onClick={() => toggleGSMSelection(index)}
                            sx={hover}
                          >
                            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedGSMIndices.includes(index)}
                                onChange={() => toggleGSMSelection(index)}
                              />
                            </TableCell>
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
              <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGSMApply}
                  sx={{
                    textTransform: "capitalize",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "13px",
                    padding: "12px 20px",
                  }}
                >
                  Apply
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleGSMClose}
                  sx={{
                    textTransform: "capitalize",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "13px",
                    padding: "12px 20px",
                  }}
                >
                  Cancel
                </Button>
              </Box>
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
              <Grid item xs={12} mt={2} sx={{ maxHeight: '50vh', overflowY: 'scroll' }}>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" size="small" className="dark-table">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">Select</TableCell>
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
                          <TableCell colSpan={4} component="th" scope="row">
                            <Typography color="error">
                              No Compositions Available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        compositionList.map((composition, index) => (
                          <TableRow
                            key={index}
                            onClick={() => toggleCompositionSelection(index)}
                            sx={hover}
                          >
                            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedCompositionIndices.includes(index)}
                                onChange={() => toggleCompositionSelection(index)}
                              />
                            </TableCell>
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
              <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCompositionApply}
                  sx={{
                    textTransform: "capitalize",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "13px",
                    padding: "12px 20px",
                  }}
                >
                  Apply
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleCompositionClose}
                  sx={{
                    textTransform: "capitalize",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "13px",
                    padding: "12px 20px",
                  }}
                >
                  Cancel
                </Button>
              </Box>
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
              <Grid item xs={12} mt={2} sx={{ maxHeight: '50vh', overflowY: 'scroll' }}>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" size="small" className="dark-table">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">Select</TableCell>
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
                          <TableCell colSpan={4} component="th" scope="row">
                            <Typography color="error">
                              No Suppliers Available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        supplierList.map((supplier, index) => (
                          <TableRow
                            key={index}
                            onClick={() => toggleSupplierSelection(index)}
                            sx={hover}
                          >
                            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedSupplierIndices.includes(index)}
                                onChange={() => toggleSupplierSelection(index)}
                              />
                            </TableCell>
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
              <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSupplierApply}
                  sx={{
                    textTransform: "capitalize",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "13px",
                    padding: "12px 20px",
                  }}
                >
                  Apply
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleSupplierClose}
                  sx={{
                    textTransform: "capitalize",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "13px",
                    padding: "12px 20px",
                  }}
                >
                  Cancel
                </Button>
              </Box>
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
              <Grid item xs={12} mt={2} sx={{ maxHeight: '50vh', overflowY: 'scroll' }}>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" size="small" className="dark-table">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">Select</TableCell>
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
                          <TableCell colSpan={4} component="th" scope="row">
                            <Typography color="error">
                              No Color Codes Available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        colorList.map((color, index) => (
                          <TableRow
                            key={index}
                            onClick={() => toggleColorSelection(index)}
                            sx={hover}
                          >
                            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedColorIndices.includes(index)}
                                onChange={() => toggleColorSelection(index)}
                              />
                            </TableCell>
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
              <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleColorApply}
                  sx={{
                    textTransform: "capitalize",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "13px",
                    padding: "12px 20px",
                  }}
                >
                  Apply
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleColorClose}
                  sx={{
                    textTransform: "capitalize",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "13px",
                    padding: "12px 20px",
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

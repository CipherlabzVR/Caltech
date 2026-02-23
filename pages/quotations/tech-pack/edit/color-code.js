import React, { useEffect, useState } from "react";
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
  CircularProgress,
} from "@mui/material";
import CachedIcon from "@mui/icons-material/Cached";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AddGSM from "@/components/UIElements/Modal/AddGSM";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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

export default function TechPackColorCode() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);

  const [openGSM, setOpenGSM] = useState(false);
  const [gsmList, setGSMList] = useState([]);
  const [selectedGSMIndex, setSelectedGSMIndex] = useState(null);

  const [openComposition, setOpenComposition] = useState(false);
  const [compositionList, setCompositionList] = useState([]);
  const [selectedCompositionIndex, setSelectedCompositionIndex] = useState(null);

  const [openSupplier, setOpenSupplier] = useState(false);
  const [supplierList, setSupplierList] = useState([]);
  const [selectedSupplierIndex, setSelectedSupplierIndex] = useState(null);

  const [openColor, setOpenColor] = useState(false);
  const [colorList, setColorList] = useState([]);
  const [selectedColorIndex, setSelectedColorIndex] = useState(null);

  const [selectedFabricIndex, setSelectedFabricIndex] = useState(null);
  const [fabList, setFabList] = useState([]);

  const fetchOngoingData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetOngoingInquiryById?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch ongoing data");
      }

      const data = await response.json();
      if (data.result) {
        setInquiry(data.result);
        fetchFabricList(data.result.ongoingInquiryId, data.result.optionId, data.result.windowType);
      }
    } catch (error) {
      console.error("Error fetching ongoing data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId) {
      fetchOngoingData();
      fetchGSMList();
      fetchCompositionList();
      fetchSupplierList();
      fetchColorList();
    }
  }, [router.isReady, ongoingInquiryId, optionId]);

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

  const handleGSMClose = () => setOpenGSM(false);
  const handleSupplierClose = () => setOpenSupplier(false);
  const handleColorClose = () => setOpenColor(false);
  const handleCompositionClose = () => setOpenComposition(false);

  const handleGSMSelection = async (index) => {
    setSelectedGSMIndex(index);
    const selectedFab = fabList[selectedFabricIndex];
    const selectedGSM = gsmList[index];
    
    await updateFabric(selectedFab, {
      GSMId: selectedGSM.id,
      GSMName: selectedGSM.name,
    });
    setOpenGSM(false);
  };

  const handleCompositionSelection = async (index) => {
    setSelectedCompositionIndex(index);
    const selectedFab = fabList[selectedFabricIndex];
    const selectedComposition = compositionList[index];
    
    await updateFabric(selectedFab, {
      CompositionId: selectedComposition.id,
      CompositionName: selectedComposition.name,
    });
    setOpenComposition(false);
  };

  const handleSupplierSelection = async (index) => {
    setSelectedSupplierIndex(index);
    const selectedFab = fabList[selectedFabricIndex];
    const selectedSupplier = supplierList[index];
    
    await updateFabric(selectedFab, {
      SupplierId: selectedSupplier.id,
      SupplierName: selectedSupplier.name,
    });
    setOpenSupplier(false);
  };

  const handleColorSelection = async (index) => {
    setSelectedColorIndex(index);
    const selectedFab = fabList[selectedFabricIndex];
    const selectedColor = colorList[index];
    
    await updateFabric(selectedFab, {
      ColorCodeId: selectedColor.id,
      ColorCodeName: selectedColor.name,
    });
    setOpenColor(false);
  };

  const updateFabric = async (selectedFab, updates) => {
    const requestBody = {
      InquiryID: parseInt(ongoingInquiryId),
      InqCode: inquiry.inquiryCode,
      OptionId: parseInt(optionId),
      FabricId: selectedFab.fabricId,
      WindowType: inquiry.windowType,
      ColorCodeId: updates.ColorCodeId ?? selectedFab.colorCodeId ?? 0,
      ColorCodeName: updates.ColorCodeName ?? selectedFab.colorCodeName ?? "",
      CompositionId: updates.CompositionId ?? selectedFab.compositionId ?? 0,
      CompositionName: updates.CompositionName ?? selectedFab.compositionName ?? "",
      GSMId: updates.GSMId ?? selectedFab.gsmId ?? 0,
      GSMName: updates.GSMName ?? selectedFab.gsmName ?? "",
      SupplierId: updates.SupplierId ?? selectedFab.supplierId ?? 0,
      SupplierName: updates.SupplierName ?? selectedFab.supplierName ?? "",
    };

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/UpdateOngoingFabric`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to update fabric");
      }

      toast.success("Fabric updated");
      fetchFabricList(ongoingInquiryId, optionId, inquiry.windowType);
    } catch (error) {
      console.error("Error updating fabric:", error);
      toast.error("Failed to update fabric");
    }
  };

  const handleReloadRow = async (index) => {
    const selectedFab = fabList[index];

    const requestBody = {
      InquiryID: parseInt(ongoingInquiryId),
      InqCode: inquiry.inquiryCode,
      OptionId: parseInt(optionId),
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

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/UpdateOngoingFabric`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to reset fabric");
      }

      toast.success("Fabric reset");
      fetchFabricList(ongoingInquiryId, optionId, inquiry.windowType);
    } catch (error) {
      console.error("Error resetting fabric:", error);
      toast.error("Failed to reset fabric");
    }
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

      if (!response.ok) throw new Error("Failed to fetch GSM List");

      const data = await response.json();
      setGSMList(data.result || []);
    } catch (error) {
      console.error("Error fetching GSM List:", error);
    }
  };

  const fetchCompositionList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Composition/GetAllComposition`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch Composition List");

      const data = await response.json();
      setCompositionList(data.result || []);
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

      if (!response.ok) throw new Error("Failed to fetch Supplier List");

      const data = await response.json();
      setSupplierList(data.result || []);
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

      if (!response.ok) throw new Error("Failed to fetch Color Code List");

      const data = await response.json();
      setColorList(data.result || []);
    } catch (error) {
      console.error("Error fetching Color Code List:", error);
    }
  };

  const fetchFabricList = async (inqId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetAllOngoingFabrics?ongoingInquiryId=${inqId}&optionId=${optId}&windowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch Fabric List");

      const data = await response.json();
      setFabList(data.result || []);
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  const navToNext = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/sizes",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const navToPrevious = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit",
      query: { inquiryId, optionId, sentQuotationId },
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <ToastContainer />

      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        windowType={inquiry ? inquiry.windowType : null}
        href="/quotations/tech-pack/"
        link="Tech Pack"
        title="Color Code - Tech Pack"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Color Code</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button variant="outlined" color="primary" onClick={navToPrevious}>
              previous
            </Button>
            <Button
              variant="outlined"
              color="primary"
              endIcon={<NavigateNextIcon />}
              onClick={navToNext}
            >
              next
            </Button>
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
                      <TableRow>
                        <TableCell colSpan={7} component="th" scope="row">
                          <Typography color="error">
                            Fabric is not selected
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      fabList.map((fab, index) => {
                        const gsmValue = fab.gsmName || "Not Selected";
                        const compositionValue = fab.compositionName || "Not Selected";
                        const supplierValue = fab.supplierName || "Not Selected";
                        const colorValue = fab.colorCodeName || "Not Selected";

                        return (
                          <TableRow key={index}>
                            <TableCell component="th" scope="row">
                              {index + 1}
                            </TableCell>
                            <TableCell>{fab.fabricName}</TableCell>
                            <TableCell align="center">
                              <Button
                                color={gsmValue === "Not Selected" ? "inherit" : "primary"}
                                onClick={() => handleGSMOpen(index)}
                              >
                                {gsmValue}
                              </Button>
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                color={compositionValue === "Not Selected" ? "inherit" : "primary"}
                                onClick={() => handleCompositionOpen(index)}
                              >
                                {compositionValue}
                              </Button>
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                color={supplierValue === "Not Selected" ? "inherit" : "primary"}
                                onClick={() => handleSupplierOpen(index)}
                              >
                                {supplierValue}
                              </Button>
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                color={colorValue === "Not Selected" ? "inherit" : "primary"}
                                onClick={() => handleColorOpen(index)}
                              >
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

      {/* GSM Modal */}
      <Modal open={openGSM} onClose={handleGSMClose}>
        <Box sx={style} className="bg-black">
          <Grid container>
            <Grid item xs={12} mt={2}>
              <AddGSM fetchItems={fetchGSMList} />
            </Grid>
            <Grid item xs={12} mt={2} sx={{ maxHeight: "50vh", overflowY: "scroll" }}>
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
                        <TableCell colSpan={3}>
                          <Typography color="error">No GSM Available</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      gsmList.map((gsm, index) => (
                        <TableRow key={index} onClick={() => handleGSMSelection(index)} sx={hover}>
                          <TableCell>{index + 1}</TableCell>
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
            <Button variant="contained" color="error" onClick={handleGSMClose} sx={{ mt: 2 }}>
              Cancel
            </Button>
          </Grid>
        </Box>
      </Modal>

      {/* Composition Modal */}
      <Modal open={openComposition} onClose={handleCompositionClose}>
        <Box sx={style} className="bg-black">
          <Grid container>
            <Grid item xs={12} mt={2}>
              <AddComposition fetchItems={fetchCompositionList} />
            </Grid>
            <Grid item xs={12} mt={2} sx={{ maxHeight: "50vh", overflowY: "scroll" }}>
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
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography color="error">No Compositions Available</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      compositionList.map((composition, index) => (
                        <TableRow key={index} onClick={() => handleCompositionSelection(index)} sx={hover}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{composition.name}</TableCell>
                          <TableCell align="right">
                            {composition.isActive ? (
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
            <Button variant="contained" color="error" onClick={handleCompositionClose} sx={{ mt: 2 }}>
              Cancel
            </Button>
          </Grid>
        </Box>
      </Modal>

      {/* Supplier Modal */}
      <Modal open={openSupplier} onClose={handleSupplierClose}>
        <Box sx={style} className="bg-black">
          <Grid container>
            <Grid item xs={12} mt={2}>
              <AddSupplier fetchItems={fetchSupplierList} />
            </Grid>
            <Grid item xs={12} mt={2} sx={{ maxHeight: "50vh", overflowY: "scroll" }}>
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
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography color="error">No Suppliers Available</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      supplierList.map((supplier, index) => (
                        <TableRow key={index} onClick={() => handleSupplierSelection(index)} sx={hover}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{supplier.name}</TableCell>
                          <TableCell align="right">
                            {supplier.isActive ? (
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
            <Button variant="contained" color="error" onClick={handleSupplierClose} sx={{ mt: 2 }}>
              Cancel
            </Button>
          </Grid>
        </Box>
      </Modal>

      {/* Color Modal */}
      <Modal open={openColor} onClose={handleColorClose}>
        <Box sx={style} className="bg-black">
          <Grid container>
            <Grid item xs={12} mt={2}>
              <AddColor fetchItems={fetchColorList} />
            </Grid>
            <Grid item xs={12} mt={2} sx={{ maxHeight: "50vh", overflowY: "scroll" }}>
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
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography color="error">No Color Codes Available</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      colorList.map((color, index) => (
                        <TableRow key={index} onClick={() => handleColorSelection(index)} sx={hover}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{color.name}</TableCell>
                          <TableCell align="right">
                            {color.isActive ? (
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
            <Button variant="contained" color="error" onClick={handleColorClose} sx={{ mt: 2 }}>
              Cancel
            </Button>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

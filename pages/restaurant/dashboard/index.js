import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import { ToastContainer } from "react-toastify";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  IconButton,
  Drawer
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LocalMallIcon from "@mui/icons-material/LocalMall";
import LunchDiningIcon from "@mui/icons-material/LunchDining";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsIcon from "@mui/icons-material/Settings";
import SoupKitchenIcon from "@mui/icons-material/SoupKitchen";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuIcon from "@mui/icons-material/Menu";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SearchBar from "./search";
import Bill from "./bill";
import Home from "./Home";
import Orders from "./Orders";
import DineIn from "./Dine-In";
import Kitchen from "./Kitchen";
import History from "./History";
import Offers from "./Offers";
import Reports from "./Reports";
import Other from "./Other";
import Settings from "./Settings";
import { formatDate } from "@/components/utils/formatHelper";
import getUserByEmail from "@/components/utils/getUserByEmail";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import usePOSShiftCheck from "@/components/utils/usePOSShiftCheck";
import getPOSShiftDetails from "@/components/utils/getPOSShiftDetails";

export default function Dashboard() {
  const router = useRouter();
  const { result: shiftResult, message: shiftMessage } = usePOSShiftCheck();
  const userEmail = localStorage.getItem("user");
  const cId = sessionStorage.getItem("category");
  const { navigate } = IsPermissionEnabled(cId);
  const today = new Date();
  const [table, setTable] = useState(null);
  const [steward, setSteward] = useState(null);
  const [pickupType, setPickUpType] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [shiftDetails, setShiftDetails] = useState(null);

  const [activeTab, setActiveTab] = useState("home");
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [isOffer, setIsOffer] = useState(false);
  const [offerTotal, setOfferTotal] = useState(null);

  const { data: user } = getUserByEmail(userEmail);
  const { data: shift } = getPOSShiftDetails();

  const menuItems = [
    { key: "home", label: "Home", icon: <HomeIcon sx={{ fontSize: "2rem", my: 1 }} /> },
    { key: "orders", label: "Orders", icon: <LocalMallIcon sx={{ fontSize: "2rem", my: 1 }} /> },
    { key: "dining", label: "Dine In", icon: <LunchDiningIcon sx={{ fontSize: "2rem", my: 1 }} /> },
    { key: "kitchen", label: "Kitchen", icon: <SoupKitchenIcon sx={{ fontSize: "2rem", my: 1 }} /> },
    { key: "history", label: "History", icon: <WorkHistoryIcon sx={{ fontSize: "2rem", my: 1 }} /> },
    { key: "offers", label: "Offers", icon: <LocalOfferIcon sx={{ fontSize: "2rem", my: 1 }} /> },
    { key: "reports", label: "Reports", icon: <DescriptionIcon sx={{ fontSize: "2rem", my: 1 }} /> },
    { key: "other", label: "Other", icon: <MenuIcon sx={{ fontSize: "2rem", my: 1 }} /> },
    { key: "exit", label: "Exit", icon: <ArrowBackIcon sx={{ fontSize: "2rem", my: 1 }} /> },
    { key: "settings", label: "Settings", icon: <SettingsIcon sx={{ fontSize: "2rem", my: 1 }} /> },
  ];

  const handleSetSearchTerm = (value) => {
    setSearchTerm(value);
  }

  const handleSetPickup = (type) => {
    setPickUpType(type);
  }

  const handleExitClick = () => {
    setExitDialogOpen(true);
  };

  const handleConfirmExit = () => {
    setExitDialogOpen(false);
    window.location.href = "/";
  };

  const handleCancelExit = () => {
    setExitDialogOpen(false);
    setActiveTab("home");
  };

  const handleUpdateItems = (items) => {
    setCartItems(items);
  }

  const handleUpdateFromBill = (items) => {
    setCartItems(items);
  }

  const handleClickOrder = (item) => {
    if (item.isOffer && item.orderId == null) {
      setOfferTotal(item.sellingPrice);
    } else {
      setOfferTotal(item.subTotal);
    }
    setIsOffer(item.isOffer);

    setOrderId(item.orderId);
    setSteward(item.stewardDetails);
    setTable(item.tableDetails);
    setCartItems(
      item.isOffer
        ? (item.orderItems || []).map((row) => ({
            ...row,
            isOfferItem: true,
            // Track current quantity as included in the offer/base so only extras add cost
            offerIncludedQty: row.qty || 0,
          }))
        : (item.orderItems || [])
    );
    setPickUpType(item.pickUpType);
  }

  const handleSetTable = (item) => {
    setTable(item);
  }
  const handleSetSteward = (item) => {
    setSteward(item);
  }

  const homeRef = useRef();

  const handleCleanBill = () => {
    setCartItems([]);
    setOrderId(null);
    // setPickUpType(null);
    setSteward(null);
    setTable(null);
    setIsOffer(false);
    setOfferTotal(null);
    if (homeRef.current) {
      homeRef.current.clean();
    }
  };


  useEffect(() => {
    if (user) {
      setUserDetails(user);
    }
    if (shift) {
      setShiftDetails(shift);
    }
    if (shiftResult) {
      Swal.fire({
        title: "Warning",
        text: shiftMessage,
        icon: "warning",
        confirmButtonText: "OK",
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/");
        }
      });
    }
  }, [user, shiftResult, shift]);


  if (!navigate) {
    return <AccessDenied />;
  }

  const SidebarContent = (
    <Box
      sx={{
        background: "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        p: 2,
        width: { xs: 240, lg: "100%" },
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid
            item
            xs={12}
            mt={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Avatar
              alt="Avishka"
              src="/images/restaurant/user-red.png"
              sx={{
                width: 70,
                height: 70,
                border: "3px solid #fe6564",
                background: "#f2e7eb",
              }}
            />
          </Grid>
          <Grid item xs={12} mb={2}>
            <Typography variant="h6" textAlign="center">
              {userDetails ?
                `${userDetails.firstName + " " + userDetails.lastName}` : ""}
            </Typography>
            <Typography textAlign="center">
              {userDetails ? userDetails.userRoleName : ""}
            </Typography>
          </Grid>
          {menuItems.map((menu, i) => (
            <Grid key={i} item xs={12} lg={6}>
              <Button
                onClick={() => {
                  if (menu.key === "exit") {
                    handleExitClick();
                    setActiveTab(menu.key);
                  } else {
                    setActiveTab(menu.key);
                  }
                  setMobileOpen(false);
                }}
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  backgroundColor: activeTab === menu.key ? "#fe6564" : "#e9eced",
                  color: activeTab === menu.key ? "#fff" : "#bdbebe",
                  "&:hover": {
                    backgroundColor:
                      activeTab === menu.key ? "#fe6564" : "#d1d5d8",
                    color: "#fff",
                    "& svg": {
                      color: "#fff",
                    },
                  },
                }}
              >
                {menu.icon}
                {menu.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );

  const BillContent = (
    <Box
      sx={{
        background: "#fff",
        height: "100%",
        p: 2,
        boxSizing: "border-box",
        width: { xs: 300, lg: "100%" },
      }}
    >
      <Bill
        billItems={cartItems}
        onUpdateFromBill={handleUpdateFromBill}
        steward={steward}
        table={table}
        pickupType={pickupType}
        onCleanBill={handleCleanBill}
        shift={shiftDetails}
        orderId={orderId}
        isOffer={isOffer}
        offerTotal={offerTotal}
      />
    </Box>
  );

  return (
    <>
      <ToastContainer />
      <Grid
        container
        sx={{
          height: "100vh",
          width: "100vw",
          p: 1,
          boxSizing: "border-box",
          background: "#f1f6fa",
          overflow: { lg: "hidden", xs: "scroll" },
        }}
      >
        <Grid container sx={{ height: "100%" }}>
          <Grid
            item
            lg={2}
            sx={{
              display: { xs: "none", lg: "flex" },
              flexDirection: "column",
              height: "100%",
            }}
          >
            {SidebarContent}
          </Grid>

          <Drawer
            anchor="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            sx={{ display: { lg: "none" } }}
          >
            {SidebarContent}
          </Drawer>

          <Drawer
            anchor="right"
            open={billOpen}
            onClose={() => setBillOpen(false)}
            sx={{ display: { lg: "none" } }}
          >
            {BillContent}
          </Drawer>

          <Grid item xs={12} lg={10} sx={{ height: "100%", overflow: "hidden" }}>
            <Box sx={{ background: "#fff" }} p={2}>
              <Grid container alignItems="center">
                <Grid item xs={2} display={{ lg: "none", xs: "flex" }}>
                  <IconButton onClick={() => setMobileOpen(true)}>
                    <MenuIcon />
                  </IconButton>
                </Grid>
                <Grid item xs={8} lg={9}>
                  <SearchBar onSearch={handleSetSearchTerm} />
                </Grid>
                <Grid
                  item
                  xs={2}
                  display={{ lg: "none", xs: "flex" }}
                  justifyContent="flex-end"
                >
                  <IconButton onClick={() => setBillOpen(true)}>
                    <ReceiptLongIcon />
                  </IconButton>
                </Grid>
                <Grid item xs={12} lg={3} display={{ xs: "none", lg: "block" }}>
                  <Typography sx={{ fontWeight: "600" }} textAlign="end">
                    {formatDate(today)}
                  </Typography>
                  <Typography textAlign="end">
                    Terminal No : #{shiftDetails ? shiftDetails.terminalNo : ""}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Box p={2}>
              <Grid container>
                <Grid item xs={12} lg={9}>
                  <Box
                    sx={{
                      background: "#f1f6fa",
                      height: "100%",
                      p: 2,
                      boxSizing: "border-box",
                    }}
                  >
                    {activeTab === "home" &&
                      <Home
                        ref={homeRef}
                        searchText={searchTerm}
                        onUpdateItems={handleUpdateItems}
                        billUpdatedItems={cartItems}
                        onChangeSteward={handleSetSteward}
                        onChangeTable={handleSetTable}
                        onSetPickupType={handleSetPickup}
                        pickupType={pickupType} />}

                    {activeTab === "orders" && <Orders searchText={searchTerm} onOrderClick={handleClickOrder} />}
                    {activeTab === "dining" && <DineIn />}
                    {activeTab === "kitchen" && <Kitchen searchText={searchTerm} />}
                    {activeTab === "history" && <History />}
                    {activeTab === "offers" && <Offers onOrderClick={handleClickOrder} />}
                    {activeTab === "reports" && <Reports />}
                    {activeTab === "other" && <Other />}
                    {activeTab === "settings" && <Settings />}
                  </Box>
                </Grid>
                <Grid
                  item
                  lg={3}
                  sx={{
                    display: { xs: "none", lg: "block" },
                    height: "100vh",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  {BillContent}
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Grid>

      <Dialog open={exitDialogOpen} onClose={handleCancelExit}>
        <DialogTitle
          sx={{ background: "#fe6564", color: "#fff", width: "350px" }}
        >
          Confirm Exit
        </DialogTitle>
        <DialogContent>
          <Typography mt={3}>Are you sure you want to exit?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelExit} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmExit} color="error">
            Yes, Exit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

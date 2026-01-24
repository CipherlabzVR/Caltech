import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LeftSidebar from "@/components/_App/LeftSidebar";
import TopNavbar from "@/components/_App/TopNavbar";
import Footer from "@/components/_App/Footer";
import ScrollToTop from "./ScrollToTop";
import ControlPanelModal from "./ControlPanelModal";
import HidableButtons from "../Dashboard/eCommerce/HidableButtons";
import AccessDenied from "../UIElements/Permission/AccessDenied";
import { TopbarContext } from "./TopbarContext";
import { CurrencyProvider, useCurrency } from "@/components/HR/CurrencyContext";
import SnowEffect from "./SnowEffect";
import NewYearEffect from "./NewYearEffect";
import HolidayGreeting from "./HolidayGreeting";
import BASE_URL from "Base/api";
import { Box, Typography, Grid, IconButton, Slide, Button, Input } from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import DescriptionIcon from "@mui/icons-material/Description";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import { formatCurrency } from "../utils/formatHelper";
import { toast } from "react-toastify";

const LayoutContent = ({ children }) => {
  const router = useRouter();
  const [isGranted, setIsGranted] = useState(true);

  const [active, setActive] = useState(true);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [activeTopbarButton, setActiveTopbarButton] = useState("quick-access");
  const [hoverMode, setHoverMode] = useState(false);
  const [pendingHostingFee, setPendingHostingFee] = useState(null);
  const [hostingFeeDate, setHostingFeeDate] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [paymentSlipFile, setPaymentSlipFile] = useState(null);
  const [paymentSlipPreview, setPaymentSlipPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const showSidebar = useCallback(() => {
    // In desktop: active = false shows sidebar (no active class = visible)
    // In mobile: active = true shows sidebar (active class = visible)
    // Check if we're in mobile view
    if (typeof window !== "undefined" && window.innerWidth < 1200) {
      setActive(true); // Mobile: active = true shows sidebar
    } else {
      setActive(false); // Desktop: active = false shows sidebar
    }
  }, []);

  const hideSidebar = useCallback(() => {
    // In desktop: active = true hides sidebar (active class = hidden)
    // In mobile: active = false hides sidebar (no active class = hidden)
    // Check if we're in mobile view
    if (typeof window !== "undefined" && window.innerWidth < 1200) {
      setActive(false); // Mobile: active = false hides sidebar
    } else {
      setActive(true); // Desktop: active = true hides sidebar
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      hideSidebar();
      setActiveTopbarButton("quick-access");
      if (router.pathname === "/") {
        router.replace("/quick-access");
      }
      return;
    }

    const fetchLandingPagePreference = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Company/GetLoggedUserLandingPage`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          hideSidebar();
          setActiveTopbarButton("quick-access");
          if (router.pathname === "/") {
            router.replace("/quick-access");
          }
          return;
        }

        const data = await response.json();
        const landingPageValue = data?.result?.result?.landingPage ?? null;

        if (landingPageValue === 2) {
          hideSidebar();
          setActiveTopbarButton("quick-access");
          if (router.pathname === "/" || router.pathname === "/quick-access") {
            router.replace("/quick-access");
          }
        } else {
          // Only auto-show sidebar on desktop, not mobile
          if (typeof window !== "undefined" && window.innerWidth >= 1200) {
            showSidebar();
          } else {
            // In mobile, keep sidebar hidden initially
            hideSidebar();
          }
          setActiveTopbarButton("menu");
          if (router.pathname === "/quick-access") {
            router.replace("/");
          }
        }
      } catch (error) {
        hideSidebar();
        setActiveTopbarButton("quick-access");
        if (router.pathname === "/") {
          router.replace("/quick-access");
        }
      }
    };

    fetchLandingPagePreference();
  }, [hideSidebar, showSidebar]);

  const fetchPendingHostingFee = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const isAuthPage =
      router.pathname === "/authentication/sign-in" ||
      router.pathname === "/authentication/sign-up" ||
      router.pathname === "/authentication/forgot-password" ||
      router.pathname === "/authentication/lock-screen" ||
      router.pathname === "/authentication/confirm-mail" ||
      router.pathname === "/authentication/logout";

    if (isAuthPage) {
      return;
    }

    fetch(`${BASE_URL}/Company/GetPendingHostingFee`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data && data.result) {
          setPendingHostingFee(data.result.pendingHostingFee);
          setHostingFeeDate(data.result.hostingFeeDate);
          setNotificationOpen(true);
        }
      })
      .catch(() => { });
  }, [router.pathname]);

  useEffect(() => {
    fetchPendingHostingFee();
  }, [fetchPendingHostingFee]);

  const handleCloseNotification = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setNotificationOpen(false);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size should be less than 10MB");
      return;
    }

    setPaymentSlipFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentSlipPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setPaymentSlipFile(null);
    setPaymentSlipPreview(null);
  };

  const handleUploadPaymentSlip = async () => {
    if (!paymentSlipFile) {
      toast.error("Please select a payment slip image");
      return;
    }

    if (!pendingHostingFee?.id) {
      toast.error("Pending hosting fee information is missing");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", paymentSlipFile);

      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Company/UploadHostingFeeInvoice`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && (data.statusCode === 200 || data.status === "SUCCESS")) {
        toast.success(data.message || "Payment slip uploaded successfully");
        setPaymentSlipFile(null);
        setPaymentSlipPreview(null);
        // Refresh pending hosting fee data after successful upload
        fetchPendingHostingFee();
      } else {
        toast.error(data.message || "Failed to upload payment slip");
      }
    } catch (error) {
      console.error("Error uploading payment slip:", error);
      toast.error("An error occurred while uploading payment slip");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const evaluateSidebarVisibility = () => {
      const viewportWidth = window.innerWidth;

      if (viewportWidth < 1200) {
        setIsSidebarHidden(!active);
        // In mobile view, if sidebar is showing (active = true), ensure it can be closed
        // CSS: .main-wrapper-content.active .LeftSidebarNav { left: 0; } shows sidebar
        // So active = true shows sidebar, active = false hides it
        // We want sidebar to start hidden in mobile, so if we're in mobile and active is true, hide it
        if (active && viewportWidth < 1200) {
          // Sidebar is showing in mobile, but we want it hidden by default
          // Don't auto-hide here, let user control it via menu button
        }
      } else {
        setIsSidebarHidden(active);
      }
    };

    evaluateSidebarVisibility();

    window.addEventListener("resize", evaluateSidebarVisibility);

    return () => {
      window.removeEventListener("resize", evaluateSidebarVisibility);
    };
  }, [active]);

  // Fix: In mobile view, ensure sidebar starts hidden on initial load
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const viewportWidth = window.innerWidth;
    if (viewportWidth < 1200) {
      // In mobile view, sidebar should start hidden
      // CSS shows: .main-wrapper-content.active .LeftSidebarNav { left: 0; } in mobile
      // So active = true shows sidebar, active = false hides it
      // Initial state is active = true, which would show sidebar in mobile
      // We need to hide it initially in mobile view
      setActive(false);
    }
  }, []);

  const handleCheckGranted = (bool) => {
    setIsGranted(bool);
  };

  const noWrapperRoutes = ["/restaurant/dashboard"];

  const isWrapperRequired = !noWrapperRoutes.includes(router.pathname);

  return (
    <TopbarContext.Provider value={{ activeButton: activeTopbarButton, setActiveButton: setActiveTopbarButton, hoverMode, setHoverMode }}>
      <>
        <Head>
          <title>CBASS-AI</title>
          <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        </Head>

        <div
          className={`${isWrapperRequired ? "main-wrapper-content" : ""} ${active ? "active" : ""
            }`}
        >
          {!(
            router.pathname === "/authentication/sign-in" ||
            router.pathname === "/authentication/sign-up" ||
            router.pathname === "/authentication/forgot-password" ||
            router.pathname === "/authentication/lock-screen" ||
            router.pathname === "/authentication/confirm-mail" ||
            router.pathname === "/authentication/logout" ||
            router.pathname === "/restaurant/dashboard"
          ) && (
              <>
                <TopNavbar
                  showSidebar={showSidebar}
                  hideSidebar={hideSidebar}
                  sidebarHidden={isSidebarHidden}
                  onActiveChange={setActiveTopbarButton}
                />

                <LeftSidebar toogleActive={hideSidebar} onGrantedCheck={handleCheckGranted} hoverMode={hoverMode} />
              </>
            )}

          <div className="main-content">
            {notificationOpen && pendingHostingFee && (
              <Box
                sx={{
                  backgroundColor: "#FA5C5C",
                  color: "#fff",
                  mt: 2,
                  mb: 2,
                  borderRadius: 2,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                }}
              >
                <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 2, position: "relative" }}>
                  {!(hostingFeeDate && new Date() > new Date(hostingFeeDate)) && (
                    <IconButton
                      onClick={handleCloseNotification}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        color: "#fff",
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                        },
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  )}
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                      <PaymentIcon sx={{ fontSize: 28, color: "#fff" }} />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: "#fff",
                          fontSize: { xs: "16px", sm: "18px", md: "20px" },
                        }}
                      >
                        Hosting Charges Payment Reminder
                      </Typography>
                    </Box>
                    {pendingHostingFee.status === 3 ? (
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(255, 255, 255, 0.9)",
                            mb: 1,
                            fontSize: { xs: "13px", sm: "14px" },
                            fontWeight: 600,
                          }}
                        >
                          Payment Rejected
                        </Typography>
                        {pendingHostingFee.rejectionReason && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(255, 255, 255, 0.9)",
                              mb: 1,
                              fontSize: { xs: "13px", sm: "14px" },
                            }}
                          >
                            Rejection Reason: {pendingHostingFee.rejectionReason}
                          </Typography>
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(255, 255, 255, 0.9)",
                            mb: 2,
                            fontSize: { xs: "13px", sm: "14px" },
                            fontStyle: "italic",
                          }}
                        >
                          Please contact admin for further assistance.
                        </Typography>
                      </>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255, 255, 255, 0.9)",
                          mb: 2,
                          fontSize: { xs: "13px", sm: "14px" },
                        }}
                      >
                        You have a pending hosting fee that requires attention. Please review the details below and complete the payment.
                      </Typography>
                    )}
                    {pendingHostingFee && (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <DescriptionIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.8)" }} />
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "rgba(255, 255, 255, 0.7)",
                                  fontSize: "11px",
                                  display: "block",
                                }}
                              >
                                Document No
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#fff",
                                  fontWeight: 500,
                                  fontSize: { xs: "13px", sm: "14px" },
                                }}
                              >
                                {pendingHostingFee.documentNo}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <PaymentIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.8)" }} />
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "rgba(255, 255, 255, 0.7)",
                                  fontSize: "11px",
                                  display: "block",
                                }}
                              >
                                Amount Due
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#fff",
                                  fontWeight: 600,
                                  fontSize: { xs: "13px", sm: "14px" },
                                }}
                              >
                                {pendingHostingFee.hostingFee
                                  ? formatCurrency(pendingHostingFee.hostingFee)
                                  : "N/A"}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        {pendingHostingFee.month && pendingHostingFee.year && (
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <CalendarTodayIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.8)" }} />
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "rgba(255, 255, 255, 0.7)",
                                    fontSize: "11px",
                                    display: "block",
                                  }}
                                >
                                  Billing Period
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#fff",
                                    fontWeight: 500,
                                    fontSize: { xs: "13px", sm: "14px" },
                                  }}
                                >
                                  {new Date(
                                    pendingHostingFee.year,
                                    pendingHostingFee.month - 1
                                  ).toLocaleString("en-US", {
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        )}

                        {/* Payment Slip Upload Section - Inline */}
                        {pendingHostingFee.status !== 3 && (
                          <Grid item xs={12} sm={6} md={pendingHostingFee.month && pendingHostingFee.year ? 3 : 6}>
                            {pendingHostingFee?.invoiceUrl && pendingHostingFee.invoiceUrl.trim() !== "" ? (
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "rgba(255, 255, 255, 0.7)",
                                    fontSize: "11px",
                                    display: "block",
                                    mb: 0.5,
                                  }}
                                >
                                  Payment Status
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "rgba(255, 255, 255, 0.9)",
                                    fontWeight: 500,
                                    fontSize: { xs: "13px", sm: "14px" },
                                  }}
                                >
                                  Payment process will update soon
                                </Typography>
                              </Box>
                            ) : (
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "rgba(255, 255, 255, 0.7)",
                                  fontSize: "11px",
                                  display: "block",
                                  mb: 1,
                                }}
                              >
                                Upload Payment Slip
                              </Typography>
                              {!paymentSlipPreview ? (
                                <Box>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    sx={{ display: "none" }}
                                    id="payment-slip-upload"
                                  />
                                  <label htmlFor="payment-slip-upload">
                                    <Button
                                      variant="outlined"
                                      component="span"
                                      startIcon={<CloudUploadIcon />}
                                      size="small"
                                      sx={{
                                        color: "#fff",
                                        borderColor: "rgba(255, 255, 255, 0.5)",
                                        "&:hover": {
                                          borderColor: "#fff",
                                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                                        },
                                        fontSize: { xs: "11px", sm: "12px" },
                                      }}
                                    >
                                      Choose Image
                                    </Button>
                                  </label>
                                </Box>
                              ) : (
                                <Box>
                                  <Box
                                    sx={{
                                      position: "relative",
                                      mb: 1,
                                      borderRadius: 1,
                                      overflow: "hidden",
                                    }}
                                  >
                                    <img
                                      src={paymentSlipPreview}
                                      alt="Payment slip preview"
                                      style={{
                                        width: "100%",
                                        maxHeight: "80px",
                                        objectFit: "contain",
                                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                                      }}
                                    />
                                    <IconButton
                                      onClick={handleRemoveFile}
                                      sx={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                                        color: "#fff",
                                        "&:hover": {
                                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                                        },
                                        width: 24,
                                        height: 24,
                                      }}
                                    >
                                      <CloseIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "rgba(255, 255, 255, 0.7)",
                                      fontSize: "10px",
                                      display: "block",
                                      mb: 0.5,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {paymentSlipFile?.name}
                                  </Typography>
                                  <Button
                                    variant="contained"
                                    onClick={handleUploadPaymentSlip}
                                    disabled={uploading}
                                    size="small"
                                    sx={{
                                      backgroundColor: "#fff",
                                      color: "#FA5C5C",
                                      "&:hover": {
                                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                                      },
                                      "&:disabled": {
                                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                                        color: "rgba(237, 108, 2, 0.5)",
                                      },
                                      fontSize: { xs: "11px", sm: "12px" },
                                    }}
                                  >
                                    {uploading ? "Uploading..." : "Upload"}
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          )}
                          </Grid>
                        )}
                      </Grid>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
            {!isGranted ? <AccessDenied /> : children}

            {!(
              router.pathname === "/authentication/sign-in" ||
              router.pathname === "/authentication/sign-up" ||
              router.pathname === "/authentication/forgot-password" ||
              router.pathname === "/authentication/lock-screen" ||
              router.pathname === "/authentication/confirm-mail" ||
              router.pathname === "/authentication/logout"
            ) && <Footer />}
          </div>
        </div>

        {/* ScrollToTop */}
        <ScrollToTop />

        {/* Theme Effects */}
        <SnowEffect />
        <NewYearEffect />
        <HolidayGreeting />

        {!(
          router.pathname === "/authentication/sign-in" ||
          router.pathname === "/authentication/sign-up" ||
          router.pathname === "/authentication/forgot-password" ||
          router.pathname === "/authentication/lock-screen" ||
          router.pathname === "/authentication/confirm-mail" ||
          router.pathname === "/authentication/logout" ||
          router.pathname === "/restaurant/dashboard"
        ) && <ControlPanelModal />}
        <HidableButtons />
      </>
    </TopbarContext.Provider>
  );
};

const Layout = ({ children }) => {
  return (
    <CurrencyProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </CurrencyProvider>
  );
};

export default Layout;

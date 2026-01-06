import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Card, CardContent, Box, Typography, Button, CircularProgress } from "@mui/material";
import Image from "next/image";

/**
 * Work Order PDF View Component - Navigation button
 * @param {string|number} workOrderId - The ID of the work order (optional)
 * @param {string} workOrderIssueDate - The issue date of the work order (optional)
 */
export const WorkOrderPdfView = ({ workOrderId, workOrderIssueDate = null }) => {
  const router = useRouter();

  const handleOpen = () => {
    // Navigate to the page with layout
    router.push({
      pathname: '/help-desk/work-order/viewPdf',
      query: { workOrderId, workOrderIssueDate }
    });
  };

  return (
    <Tooltip title="View PDF">
      <IconButton
        size="small"
        color="primary"
        onClick={handleOpen}
      >
        <VisibilityIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

/**
 * Page component that displays A4 size card with app layout
 */
export default function ViewPdfPage() {
  // A4 dimensions: 210mm × 297mm
  // At 96 DPI: ~794px × 1123px
  const a4Width = '210mm'; // A4 width
  const a4Height = '297mm'; // A4 height
  const contentRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [workOrderData, setWorkOrderData] = useState(null);
  const router = useRouter();

  // Fetch work order data
  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        const workOrderId = router.query.workOrderId || '1';
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        const response = await fetch(`${BASE_URL}/HelpDesk/GetWorkOrderById?id=${workOrderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch work order');
        }

        const data = await response.json();
        // Handle different response structures
        if (data.result) {
          setWorkOrderData(data.result);
        } else if (data.workOrder || data.materials) {
          setWorkOrderData(data);
        } else {
          setWorkOrderData(data);
        }
      } catch (error) {
        console.error('Error fetching work order:', error);
      }
    };

    if (router.isReady) {
      fetchWorkOrder();
    }
  }, [router.isReady, router.query.workOrderId]);


  console.log('Work Order API Response:', workOrderData);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch (e) {
      return '';
    }
  };

  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    // If time is in format "HH:mm:ss", extract just "HH:mm"
    if (timeString.includes(':')) {
      return timeString.substring(0, 5);
    }
    return timeString;
  };

  // Helper function to get city, state, zip string
  const getCityStateZip = (city, state, zip) => {
    const parts = [];
    if (city) parts.push(city);
    if (state) parts.push(`State: ${state}`);
    if (zip) parts.push(`Zip: ${zip}`);
    return parts.length > 0 ? parts.join(', ') : '';
  };

  // Extract work order and materials from response
  const workOrder = workOrderData?.workOrder || null;
  const materials = workOrderData?.materials || [];

  const handleDownloadPdf = async () => {
    if (!contentRef.current || isDownloading) return;

    setIsDownloading(true);
    try {
      // Dynamically import html2pdf.js
      const html2pdf = (await import('html2pdf.js')).default;

      const element = contentRef.current;

      // Store original inline styles
      const originalFlexDirection = element.style.flexDirection;
      const originalGap = element.style.gap;

      // Temporarily change layout to column for PDF generation
      element.style.setProperty('flex-direction', 'column', 'important');
      element.style.setProperty('gap', '0', 'important');

      // Wait for DOM to update using requestAnimationFrame
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 200);
          });
        });
      });

      // Wait for all images to load
      const images = element.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if image fails
            setTimeout(resolve, 2000); // Timeout after 2 seconds
          });
        })
      );

      // Get both cards
      const cards = element.querySelectorAll('[class*="MuiCard-root"]');

      if (cards.length >= 2) {
        // Import html2canvas and jspdf
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        // Generate each card as canvas
        const canvasOpt = {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
        };

        // Generate first card as canvas
        const canvas1 = await html2canvas(cards[0], canvasOpt);

        // Generate second card as canvas
        const canvas2 = await html2canvas(cards[1], canvasOpt);

        // Create PDF with exactly 2 pages using jspdf
        const pdf = new jsPDF({
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        });

        // Add first page
        const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297);

        // Add second page
        pdf.addPage();
        const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData2, 'JPEG', 0, 0, 210, 297);

        pdf.save('work-order.pdf');
      } else {
        // Fallback: single element conversion
        const opt = {
          margin: [0, 0, 0, 0],
          filename: 'work-order.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false,
            allowTaint: true,
            backgroundColor: '#ffffff',
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
            compress: true,
          },
        };
        await html2pdf().set(opt).from(element).save();
      }

      // Restore original styles immediately
      element.style.flexDirection = originalFlexDirection;
      element.style.gap = originalGap;
      element.style.height = '';
      element.style.overflow = '';

      setIsDownloading(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error details:', error.message, error.stack);
      // Restore original styles on error
      if (contentRef.current) {
        contentRef.current.style.flexDirection = '';
        contentRef.current.style.gap = '';
        contentRef.current.style.height = '';
        contentRef.current.style.overflow = '';
      }
      setIsDownloading(false);
    }
  };

  return (
    <Box>
      {/* Back and Download Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          padding: '10px',
        }}
        mb={2}
      >
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={handleDownloadPdf}
          disabled={isDownloading}
        >
          {isDownloading ? 'Generating PDF...' : 'Download PDF'}
        </Button>
      </Box>

      {/* Content Container with ref */}
      <Box
        ref={contentRef}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'center',
          alignItems: 'flex-start',
          minHeight: '100vh',
          gap: { xs: '50px', md: 1 },
          backgroundColor: '#f5f5f5',
        }}
      >
        <Card
          className="page-break-avoid"
          sx={{
            width: a4Width,
            minHeight: a4Height,
            maxWidth: '100%',
            boxShadow: 3,
            backgroundColor: '#ffffff',
          }}
          style={{
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
          }}
        >
          <CardContent sx={{ padding: '1cm 0.5cm' }}>
            {/* Header Section with Border */}
        <Box
          sx={{
                border: '2px solid #000000',
                padding: '0mm 0mm',
                position: 'relative',
              }}
            >
              {/* Top Section: Logo and WORK ORDER Title */}
              <Box
              sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: "15px"
                }}
              >
                {/* Logo Section - Center */}
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    src="/images/cbass.png"
                    alt="CBASS Logo"
                    width={150}
                    height={60}
                    style={{ objectFit: 'contain' }}
                  />
        </Box>

                {/* WORK ORDER Title - Right */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#000000',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                      marginBottom: '2px',
                    }}
                  >
                    WORK
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#000000',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                    }}
                  >
                    ORDER
                  </Typography>
                </Box>
              </Box>

              {/* Separator Line */}
              <Box
                sx={{
                  borderTop: '1px solid #000000',
                  width: '100%',
                  marginBottom: '2px',
                }}
              />

              {/* Date Section - Right Aligned */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  border: '1px solid black',
                  margin: '1px',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '10px',
                    color: '#000000',
                    fontWeight: 400,
                    padding: '1px'
                  }}
                >
                  WORK ORDER ISSUE DATE {workOrder?.workOrderIssueDate ? formatDate(workOrder.workOrderIssueDate) : ''}
                </Typography>
              </Box>
            </Box>

            {/* Work Order Details Section */}
            <Box
              sx={{
                border: '1px solid #000000',
                borderTop: 'none',
                padding: '6px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              {/* Left Column */}
              <Box sx={{ flex: 1, paddingRight: '6px' }}>
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginBottom: '3px',
                  }}
                >
                  WORK ORDER: {workOrder?.workOrderNumber || ''}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '10px',
                    color: '#000000',
                    marginBottom: '3px',
                  }}
                >
                  PROJECT NAME: {workOrder?.projectName || ''}
                </Typography>
              </Box>

              {/* Center Column */}
              <Box sx={{ flex: 1, paddingLeft: '6px', paddingRight: '6px' }}>
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginBottom: '3px',
                  }}
                >
                  REQUIRED ARRIVAL DATE & TIME
                </Typography>
                <Typography
                  sx={{
                    fontSize: '10px',
                    color: '#000000',
                  }}
                >
                  {workOrder?.requiredArrivalDate ? formatDate(workOrder.requiredArrivalDate) : ''} {workOrder?.requiredArrivalTime ? formatTime(workOrder.requiredArrivalTime) : ''}
                </Typography>
              </Box>

              {/* Right Column */}
              <Box sx={{ flex: 1, paddingLeft: '6px' }}>
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginBottom: '5px',
                  }}
                >
                  REFERENCE PO# {workOrder?.referencePONumber || ''}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#000000',
                  }}
                >
                  TICKET # {workOrder?.ticketNumber || ''}
                </Typography>
              </Box>
            </Box>

            {/* Four Section Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                border: '1px solid #000000',
                borderTop: 'none',
                marginTop: '6px',
              }}
            >
              {/* Top-Left: JOB SITE INFORMATION */}
              <Box
                sx={{
                  borderRight: '1px solid #000000',
                  borderBottom: '1px solid #000000',
                }}
              >
                <Box
                  sx={{
                    backgroundColor: '#000000',
                    padding: '5px',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#FFFFFF',
                      textTransform: 'uppercase',
                    }}
                  >
                    JOB SITE INFORMATION
                  </Typography>
                </Box>
                <Box sx={{ padding: '6px' }}>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    {workOrder?.jobSiteClientName || 'Client Name'}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    {workOrder?.jobSiteBrand || 'Site Name Work'}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    {workOrder?.jobSiteWorkLocation || 'Location'}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    {workOrder?.jobSiteSiteNumber || 'Site Number'}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    {workOrder?.jobSiteAddress || 'Address'}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    {getCityStateZip(workOrder?.jobSiteCity, workOrder?.jobSiteState, workOrder?.jobSiteZip) || 'City, State, Zip'}
                  </Typography>
                </Box>
              </Box>

              {/* Top-Right: CUSTOMER INFORMATION */}
              <Box
                sx={{
                  borderBottom: '1px solid #000000',
                }}
              >
                <Box
                  sx={{
                    backgroundColor: '#000000',
                    padding: '5px',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#FFFFFF',
                      textTransform: 'uppercase',
                    }}
                  >
                    CUSTOMER INFORMATION
                  </Typography>
                </Box>
                <Box sx={{ padding: '6px' }}>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    Company: {workOrder?.customerCompanyName || ''}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    Address: {workOrder?.customerAddress || ''}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    {getCityStateZip(workOrder?.customerCity, workOrder?.customerState, workOrder?.customerZip) || ''}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    Contact Name: {workOrder?.customerPointOfContact || ''}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    Contact Phone: {workOrder?.customerPhone || workOrder?.customerCell || ''}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    Contact Email: {workOrder?.ticket?.customerEmail || ''}
                  </Typography>
                </Box>
              </Box>

              {/* Bottom-Left: CERTIFIED PARTNER INFORMATION */}
              <Box
                sx={{
                  borderRight: '1px solid #000000',
                }}
              >
                <Box
                  sx={{
                    backgroundColor: '#000000',
                    padding: '5px',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#FFFFFF',
                      textTransform: 'uppercase',
                    }}
                  >
                    CERTIFIED PARTNER INFORMATION
                  </Typography>
                </Box>
                <Box sx={{ padding: '6px' }}>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    {workOrder?.partnerCompanyName || 'Company Name'}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    {workOrder?.partnerAddress || 'Address'}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    {getCityStateZip(workOrder?.partnerCity, workOrder?.partnerState, workOrder?.partnerZip) || 'City, State, Zip'}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    {workOrder?.partnerTelephone ? `Telephone: ${workOrder.partnerTelephone}` : ''} {workOrder?.partnerFacsimile ? `Facsimile: ${workOrder.partnerFacsimile}` : ''}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                    {workOrder?.partnerPointOfContact || 'Point of Contact'}
                  </Typography>
                </Box>
              </Box>

              {/* Bottom-Right: BEHAVIORAL GUIDELINES WHILE ON SITE */}
              <Box>
                <Box
                  sx={{
                    backgroundColor: '#000000',
                    padding: '5px',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#FFFFFF',
                      textTransform: 'uppercase',
                    }}
                  >
                    BEHAVIORAL GUIDELINES WHILE ON SITE
                  </Typography>
                </Box>
                <Box sx={{ padding: '6px' }}>
                  {workOrder?.behavioralGuidelines ? (
                    workOrder.behavioralGuidelines.split('\r\n').map((line, index) => (
                      <Typography key={index} sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px' }}>
                        {line}
                      </Typography>
                    ))
                  ) : (
                    <>
                      <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px' }}>
                        1. Smile and be friendly, courteous and helpful
                      </Typography>
                      <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px' }}>
                        2. Be properly groomed
                      </Typography>
                      <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px' }}>
                        3. Be on time and only in authorized areas of the site
                      </Typography>
                      <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px' }}>
                        4. Answer questions in a mature, direct and thoughtful manner
                      </Typography>
                      <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px' }}>
                        5. Complete the assigned tasks in the most expeditious manner possible
                      </Typography>
                      <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px' }}>
                        6. Report any new opportunities that may arise directly to Comcast
                      </Typography>
                      <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px' }}>
                        7. Please do not discuss price or attempt to compete with Comcast
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Box>

            {/* DESCRIPTION OF WORK REQUESTED Section */}
            <Box sx={{ marginTop: '6px' }}>
              {/* Red Header Bar */}
              <Box
                sx={{
                  backgroundColor: '#FF0000',
                  padding: '6px',
                  textAlign: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                  }}
                >
                  DESCRIPTION OF WORK REQUESTED
                </Typography>
              </Box>

              {/* Two Thin Lines Below Header */}
              <Box
                sx={{
                  borderTop: '2px solid #000000',
                  marginTop: 0,
                  marginBottom: 0,
                }}
              />

              {/* Main Content Grid */}
              <Box
                sx={{
                  border: '1px solid #000000',
                  borderTop: 'none',
                }}
              >
                {/* Row 1: NATURE OF THE ACTIVITY */}
                <Box
                  sx={{
                    display: 'flex',
                    borderBottom: '1px solid #000000',
                  }}
                >
                  <Box
                    sx={{
                      flex: '0.25',
                      borderRight: '1px solid #000000',
                      padding: '6px',
                      minHeight: '80px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        textTransform: 'uppercase',
                      }}
                    >
                      NATURE OF THE ACTIVITY
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: '0.75',
                      borderTop: 'none',
                      borderRight: 'none',
                      margin: '3px',
                      minHeight: '80px',
                      padding: '6px',
                    }}
                  >
                    <Typography sx={{ fontSize: '9px', color: '#000000', whiteSpace: 'pre-wrap' }}>
                      {workOrder?.natureOfActivity || ''}
                    </Typography>
                  </Box>
                </Box>

                {/* Row 2: SPECIAL INSTRUCTIONS */}
                <Box
                  sx={{
                    display: 'flex',
                    borderBottom: '1px solid #000000',
                  }}
                >
                  <Box
                    sx={{
                      flex: '0.25',
                      borderRight: '1px solid #000000',
                      padding: '6px',
                      minHeight: '60px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        textTransform: 'uppercase',
                      }}
                    >
                      SPECIAL INSTRUCTIONS
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '7px',
                        color: '#000000',
                        marginTop: '2px',
                        fontStyle: 'normal',
                      }}
                    >
                      (additional detail may be attached herewith)
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: '0.75',
                      borderTop: 'none',
                      borderRight: 'none',
                      margin: '3px',
                      minHeight: '60px',
                      padding: '6px',
                    }}
                  >
                    <Typography sx={{ fontSize: '9px', color: '#000000', whiteSpace: 'pre-wrap' }}>
                      {workOrder?.specialInstructions || ''}
                    </Typography>
                  </Box>
                </Box>

                {/* Row 3: WORKMANSHIP AND STANDARDS */}
                <Box
                  sx={{
                    display: 'flex',
                    borderBottom: '1px solid #000000',
                  }}
                >
                  <Box
                    sx={{
                      flex: '0.25',
                      borderRight: '1px solid #000000',
                      padding: '6px',
                      minHeight: '40px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        textTransform: 'uppercase',
                      }}
                    >
                      WORKMANSHIP AND STANDARDS
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: '0.75',
                      borderTop: 'none',
                      borderRight: 'none',
                      margin: '3px',
                      minHeight: '40px',
                      padding: '6px',
                    }}
                  >
                    <Typography sx={{ fontSize: '9px', color: '#000000', whiteSpace: 'pre-wrap' }}>
                      {workOrder?.workmanshipAndStandards || ''}
                    </Typography>
                  </Box>
                </Box>

                {/* Row 4: DELIVERABLES */}
                <Box
                  sx={{
                    display: 'flex',
                  }}
                >
                  <Box
                    sx={{
                      flex: '0.25',
                      borderRight: '1px solid #000000',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        textTransform: 'uppercase',
                      }}
                    >
                      DELIVERABLES
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: '0.75',
                      padding: '10px',
                    }}
                  >
                    {workOrder?.deliverables ? (
                      <Typography sx={{ fontSize: '9px', color: '#000000', whiteSpace: 'pre-wrap' }}>
                        {workOrder.deliverables}
                      </Typography>
                    ) : (
                      <>
                        <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                          1. Before Work
                        </Typography>
                        <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                          2. After Work
                        </Typography>
                        <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                          3. Work Order
                        </Typography>
                        <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px' }}>
                          4. Equipment Cabinet/Rack
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Two Thick Lines at Bottom */}
              <Box
                sx={{
                  borderTop: '2px solid #000000',
                  marginTop: 0,
                  marginBottom: 0,
                }}
              />
            </Box>

            {/* MATERIAL & OTHER ITEMS USED Section */}
            <Box sx={{ marginTop: '10px' }}>
              {/* Header */}
              <Box
                sx={{
                  backgroundColor: '#000000',
                  padding: '5px',
                  textAlign: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                  }}
                >
                  MATERIAL & OTHER ITEMS USED - PLEASE COMPLETE***
                </Typography>
              </Box>

              {/* Table */}
              <Box
                sx={{
                  border: '1px solid #000000',
                  borderTop: 'none',
                }}
              >
                {/* Table Header */}
                <Box
                  sx={{
                    display: 'flex',
                  }}
                >
                  <Box sx={{ flex: '0.5', borderRight: '1px solid #FFFFFF', padding: '5px' }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}
                    >

                      <u>LINE ITEM</u>
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '2', borderRight: '1px solid #FFFFFF', padding: '5px' }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}
                    >
                      <u>ITEM DESCRIPTION</u>
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '0.8', borderRight: '1px solid #FFFFFF', padding: '5px', textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}
                    >
                      <u>QTY</u>
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1', borderRight: '1px solid #FFFFFF', padding: '5px', textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}
                    >
                      <u>EST UNIT PRICE</u>
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1', borderRight: '1px solid #FFFFFF', padding: '5px', textAlign: 'center' }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}
                    >
                      <u>EST TOTAL PRICE</u>
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1', padding: '5px', textAlign: 'right' }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}
                    >
                      <u>PURPOSE</u>
                    </Typography>
                  </Box>
                </Box>

                {/* Table Rows */}
                {materials && materials.length > 0 ? (
                  materials.map((material, index) => (
                    <Box
                      key={material.id || index}
                      sx={{
                        display: 'flex',
                        borderBottom: index < materials.length - 1 ? '1px solid #000000' : 'none',
                      }}
                    >
                      <Box sx={{ flex: '0.5', padding: '3px' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                          {String(material.lineItem || index + 1).padStart(3, '0')}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '2', padding: '3px' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                          {material.itemDescription || ''}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '0.8', padding: '3px', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                          {material.quantity || ''}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1', padding: '3px', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                          {material.estimatedUnitPrice ? material.estimatedUnitPrice.toFixed(2) : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1', padding: '3px', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                          {material.estimatedTotalPrice ? material.estimatedTotalPrice.toFixed(2) : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1', padding: '3px', textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                          {material.purpose || ''}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                      }}
                    >
                      <Box sx={{ flex: '0.5', padding: '3px' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}>001</Typography>
                      </Box>
                      <Box sx={{ flex: '2', padding: '3px' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}></Typography>
                      </Box>
                      <Box sx={{ flex: '0.8', padding: '3px', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}></Typography>
                      </Box>
                      <Box sx={{ flex: '1', padding: '3px', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}></Typography>
                      </Box>
                      <Box sx={{ flex: '1', padding: '3px', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}></Typography>
                      </Box>
                      <Box sx={{ flex: '1', padding: '3px', textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}></Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                      }}
                    >
                      <Box sx={{ flex: '0.5', padding: '3px' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}>002</Typography>
                      </Box>
                      <Box sx={{ flex: '2', padding: '3px' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}></Typography>
                      </Box>
                      <Box sx={{ flex: '0.8', padding: '3px', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}></Typography>
                      </Box>
                      <Box sx={{ flex: '1', padding: '3px', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}></Typography>
                      </Box>
                      <Box sx={{ flex: '1', padding: '3px', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}></Typography>
                      </Box>
                      <Box sx={{ flex: '1', padding: '3px', textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}></Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>

            {/* SCHEDULE AND RELEASE INFORMATION Section */}
            <Box sx={{ marginTop: '10px' }}>
              {/* Header */}
              <Box
                sx={{
                  backgroundColor: '#000000',
                  padding: '5px',
                  textAlign: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                  }}
                >
                  SCHEDULE AND RELEASE INFORMATION - PLEASE COMPLETE***
                </Typography>
              </Box>

              {/* Input Fields */}
              <Box
                sx={{
                  border: '1px solid #000000',
                  borderTop: 'none',
                  padding: '6px',
                }}
              >
                {/* Row 1 */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    marginBottom: '5px',
                    paddingBottom: '3px',
                    gap: '5px',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        marginRight: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ARRIVAL DATE
                    </Typography>
                    <Box
                      sx={{
                        borderBottom: '1px solid #000000',
                        flex: 1,
                        minHeight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '3px',
                      }}
                    >
                      <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                        {workOrder?.arrivalDate ? formatDate(workOrder.arrivalDate) : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        marginRight: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ARRIVAL TIME
                    </Typography>
                    <Box
                      sx={{
                        borderBottom: '1px solid #000000',
                        flex: 1,
                        minHeight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '3px',
                      }}
                    >
                      <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                        {workOrder?.arrivalTime ? formatTime(workOrder.arrivalTime) : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        marginRight: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      DEPART DATE
                    </Typography>
                    <Box
                      sx={{
                        borderBottom: '1px solid #000000',
                        flex: 1,
                        minHeight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '3px',
                      }}
                    >
                      <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                        {workOrder?.departDate ? formatDate(workOrder.departDate) : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        marginRight: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      DEPART TIME
                    </Typography>
                    <Box
                      sx={{
                        borderBottom: '1px solid #000000',
                        flex: 1,
                        minHeight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '3px',
                      }}
                    >
                      <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                        {workOrder?.departTime ? formatTime(workOrder.departTime) : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        marginRight: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      CNS RELEASE NUMBER
                    </Typography>
                    <Box
                      sx={{
                        borderBottom: '1px solid #000000',
                        flex: 1,
                        minHeight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '3px',
                      }}
                    >
                      <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                        {workOrder?.cnsReleaseNumber || ''}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Row 2 */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    marginBottom: '5px',
                    paddingBottom: '3px',
                    gap: '10px',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'baseline', flex: 2 }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        marginRight: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      TECHNICIAN/ENGINEER NAME
                    </Typography>
                    <Box
                      sx={{
                        borderBottom: '1px solid #000000',
                        flex: 1,
                        minHeight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '3px',
                      }}
                    >
                      <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                        {workOrder?.technicianName || ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', flex: 2 }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        marginRight: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      MOBILE TELEPHONE NUMBER
                    </Typography>
                    <Box
                      sx={{
                        borderBottom: '1px solid #000000',
                        flex: 1,
                        minHeight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '3px',
                      }}
                    >
                      <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                        {workOrder?.technicianMobile || ''}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Row 3 */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'baseline', flex: 3 }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        marginRight: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      TECHNICIAN/ENGINEER SIGNATURE
                    </Typography>
                    <Box
                      sx={{
                        borderBottom: '1px solid #000000',
                        flex: 1,
                        minHeight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '3px',
                      }}
                    >
                      <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                        {workOrder?.technicianSignature || ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        marginRight: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      DATE
                    </Typography>
                    <Box
                      sx={{
                        borderBottom: '1px solid #000000',
                        flex: 1,
                        minHeight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '3px',
                      }}
                    >
                      <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                        {workOrder?.technicianSignatureDate ? formatDate(workOrder.technicianSignatureDate) : ''}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Second A4 Page - SITE CONTACT CERTIFICATION & QUESTIONNAIRE */}
        <Card
          className="page-break-avoid"
          sx={{
            width: a4Width,
            minHeight: a4Height,
            maxWidth: '100%',
            boxShadow: 1,
            backgroundColor: '#ffffff',
          }}
          style={{
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
          }}
        >
          <CardContent sx={{ padding: '1cm 0.5cm' }}>
            {/* Header */}
            <Box
              sx={{
                backgroundColor: '#000000',
                padding: '5px',
                textAlign: 'center',
                marginBottom: '6px',
              }}
            >
              <Typography
                sx={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                }}
              >
                SITE CONTACT CERTIFICATION & QUESTIONNAIRE
              </Typography>
            </Box>

            {/* Main Content Area with Double Border */}
            <Box
              sx={{
                border: '2px solid #000000',
                display: 'flex',
              }}
            >
              {/* Left Column - Feedback Section */}
              <Box
                sx={{
                  flex: 1,
                  borderRight: '1px solid #000000',
                  padding: '6px',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '9px',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                    color: '#000000',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  THANK YOU FOR TAKING A MOMENT TO TELL US HOW WE DID
                </Typography>

                <Box sx={{ marginBottom: '5px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '10px', color: '#000000' }}>
                      Job completed satisfactorily?
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: '#000000' }}>
                      {workOrder?.workCompleted !== null && workOrder?.workCompleted !== undefined 
                        ? (workOrder.workCompleted ? 'Yes' : 'No') 
                        : 'Yes  No'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ marginBottom: '5px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '10px', color: '#000000' }}>
                      Professional/courteous?
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: '#000000' }}>
                      Yes  No
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ marginBottom: '5px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '10px', color: '#000000' }}>
                      Would you like us to follow up regarding this job?
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: '#000000' }}>
                      Yes  No
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Right Column - Certification and Contact Information */}
              <Box
                sx={{
                  flex: 1,
                  padding: '6px',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '9px',
                    color: '#000000',
                    marginBottom: '6px',
                    lineHeight: 1.2,
                  }}
                >
                  Undersigned authorized representative certifies that the above work has been completed and that, in the course of performing such work, no damage has occurred to subject property or any of its contents.
                </Typography>

                <Box sx={{ marginBottom: '6px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        marginRight: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      AUTHORIZED SITE CONTACT NAME
                    </Typography>
                    <Box
                      sx={{
                        borderBottom: '1px solid #000000',
                        flex: 1,
                        minHeight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '3px',
                      }}
                    >
                      <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                        {workOrder?.siteContactName || ''}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', flex: 2 }}>
                      <Typography
                        sx={{
                          fontSize: '9px',
                          fontWeight: 'bold',
                          color: '#000000',
                          marginRight: '5px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        AUTHORIZED SITE CONTACT SIGNATURE
                      </Typography>
                      <Box
                        sx={{
                          borderBottom: '1px solid #000000',
                          flex: 1,
                          minHeight: '15px',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '3px',
                        }}
                      >
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                          {workOrder?.siteContactSignature || ''}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '9px',
                          fontWeight: 'bold',
                          color: '#000000',
                          marginRight: '5px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        DATE
                      </Typography>
                      <Box
                        sx={{
                          borderBottom: '1px solid #000000',
                          flex: 1,
                          minHeight: '15px',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '3px',
                        }}
                      >
                        <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                          {workOrder?.siteContactSignatureDate ? formatDate(workOrder.siteContactSignatureDate) : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                    <Typography
                      sx={{
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#000000',
                        marginRight: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ADDITIONAL COMMENTS
                    </Typography>
                    <Box
                      sx={{
                        borderBottom: '1px solid #000000',
                        flex: 1,
                        minHeight: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '3px',
                      }}
                    >
                      <Typography sx={{ fontSize: '9px', color: '#000000', whiteSpace: 'pre-wrap' }}>
                        {workOrder?.siteContactCertification || ''}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* What Cal Tech services inc expects of field resources */}
            <Box
              sx={{
                flex: 1,
                borderLeft: '1px solid #000000',
                borderRight: '1px solid #000000',
                borderBottom: '1px solid #000000',
                padding: '6px',
              }}
            >

              <Box sx={{ marginTop: '6px', padding: '6px' }}>
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  What Cal Tech services inc expects of field resources
                </Typography>

                {/* a. Preparation */}
                <Typography
                  sx={{
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginTop: '5px',
                    marginBottom: '3px',
                  }}
                >
                  a. Preparation
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px', lineHeight: 1.0 }}>
                  You are expected to thoroughly review all documentation pertaining to all assigned jobs, BEFORE arriving at job site.
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px', lineHeight: 1.0 }}>
                  You are expected to bring a printed copy of the Work Order, and job specific Scope/Script documentation.
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px', lineHeight: 1.0 }}>
                  Schedule adequate time to complete the job.
                </Typography>

                {/* b. Dress and Grooming */}
                <Typography
                  sx={{
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginTop: '5px',
                    marginBottom: '3px',
                  }}
                >
                  b. Dress and Grooming
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • Be properly groomed
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • Khakis or fitted jeans without holes or tears
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • Work shoes or boots
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • Shirt with a collar (golf or polo style)
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • Shirt should be tucked in
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • No shirts with logos
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • No shorts
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • No Flip Flops or Sandals
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • No tattered or torn or dirty or ill-fitting clothes or shoes
                </Typography>

                {/* c. Be Courteous */}
                <Typography
                  sx={{
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginTop: '5px',
                    marginBottom: '3px',
                  }}
                >
                  c. Be Courteous
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px', lineHeight: 1.0 }}>
                  On Time arrival is required.
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '3px', lineHeight: 1.0 }}>
                  Pleasantries and greetings are expected, but additional conversation should be kept to a minimum.
                </Typography>

                {/* d. What not to say to the End Client */}
                <Typography
                  sx={{
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginTop: '5px',
                    marginBottom: '3px',
                  }}
                >
                  d. What not to say to the End Client (in person or on the phone)
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • "I do not know what I am doing"
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • "This is the first time I have done this"
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • "I was just assigned this job and haven't had a chance to review the scope"
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • "I only have limited availability to complete this assignment"
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • "The documentation isn't clear"
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • "The tech onsite before me really messed things up, or didn't do a good job"
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • "The work area is dirty or is a mess"
                </Typography>
                <Typography
                  sx={{
                    fontSize: '7px',
                    color: '#000000',
                    marginTop: '3px',
                    fontStyle: 'italic',
                    lineHeight: 1.0,
                  }}
                >
                  ***These are all things you should discuss with your Comcast Project Coordinator (outside of the end clients listening range)
                </Typography>

                {/* e. Things you should only discuss with your Project Coordinator */}
                <Typography
                  sx={{
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginTop: '5px',
                    marginBottom: '3px',
                  }}
                >
                  e. Things you should only discuss with your Project Coordinator (never within listening range of the end client)
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • Questions about the Scope
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • Approval for a Change Order or any other cost/payment related items (the end client cannot approve these items)
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • Anything derogatory about site conditions.
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • Anything that is recommended for future improvements.
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • Questions about removing equipment. Never remove equipment without approval from Cal Tech Services Inc Project Coordinator
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000', marginBottom: '2px', marginLeft: '8px', lineHeight: 1.0 }}>
                  • Anything that could be identified as the cause of the current issue, or reason for the current project.
                </Typography>

                {/* Footer/Disclaimer */}
                <Typography
                  sx={{
                    fontSize: '7px',
                    color: '#000000',
                    marginTop: '10px',
                    lineHeight: 1.0,
                  }}
                >
                  Failure of Contractor/Certified Partner to arrive at designated job site on or before required arrival date & time, failure to be properly equipped with appropriate tools or written documentation expressly requested or reasonably expected by Cal tech services Inc or behavior contrary to professional decorum may result in the cancellation of this WO, the associated PO and subsequently any compensation for the Contractor
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

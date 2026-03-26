import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ViewImage from "@/components/UIElements/Modal/ViewImage";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadingScreen from "@/pages/inquiry/edit-inquiry/uploading";

// Document panels for T-Shirt
const DOCUMENT_PANELS = [
  { contentType: 1, name: "Front" },
  { contentType: 2, name: "Back" },
  { contentType: 3, name: "Back Inside" },
  { contentType: 4, name: "Left Sleeve" },
  { contentType: 5, name: "Right Sleeve" },
];

// Document sub-content types
const SUB_CONTENT_TYPES = [
  { id: 5, name: "Plain" },
  { id: 1, name: "EMB" },
  { id: 2, name: "SUB" },
  { id: 3, name: "S Print" },
  { id: 4, name: "DTF" },
];

export default function TechPackDocumentPanel({ windowTypeName }) {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId, windowType: queryWindowType } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState({});
  const [checkedStates, setCheckedStates] = useState({});

  const fetchOngoingData = async () => {
    try {
      setLoading(true);
      const windowParam = queryWindowType != null && queryWindowType !== "" ? `&windowType=${queryWindowType}` : "";
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetOngoingInquiryById?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}${windowParam}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch ongoing data");

      const data = await response.json();
      if (data.result) {
        setInquiry(data.result);
        fetchDocuments(data.result.ongoingInquiryId, data.result.optionId, data.result.windowType);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (ongoingId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetAllOngoingDocumentPanels?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const docsMap = {};
        const checkedMap = {};

        if (data.result && Array.isArray(data.result)) {
          data.result.forEach((doc) => {
            const key = `${doc.documentContentType}_${doc.documentSubContentType}`;
            docsMap[key] = doc;
            checkedMap[key] = true;
          });
        }

        setDocuments(docsMap);
        setCheckedStates(checkedMap);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId) {
      fetchOngoingData();
    }
  }, [router.isReady, ongoingInquiryId, optionId]);

  const navToPrevious = () => {
    const prevRoutes = {
      1: "/quotations/tech-pack/edit/tshirt/sleeve",
      2: "/quotations/tech-pack/edit/shirt/sleeve",
      3: "/quotations/tech-pack/edit/cap/info",
      4: "/quotations/tech-pack/edit/visor/components",
      5: "/quotations/tech-pack/edit/sizes",
      6: "/quotations/tech-pack/edit/sizes",
      7: "/quotations/tech-pack/edit/bottom/component",
      8: "/quotations/tech-pack/edit/short/component",
    };
    router.push({
      pathname: prevRoutes[inquiry?.windowType] || "/quotations/tech-pack/edit/sizes",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const navToNext = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/summary",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const handleCheckboxChange = (contentType, subContentType, docId) => {
    return async (event) => {
      const isChecked = event.target.checked;
      const key = `${contentType}_${subContentType}`;
      
      setCheckedStates((prev) => ({ ...prev, [key]: isChecked }));

      if (!inquiry) return;

      try {
        if (isChecked) {
          // Create document without URL
          const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingDocumentPanel`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              Id: 0,
              InquiryID: inquiry.ongoingInquiryId,
              InqCode: inquiry.inquiryCode,
              OptionId: inquiry.optionId,
              WindowType: inquiry.windowType,
              DocumentType: 4,
              DocumentContentType: contentType,
              DocumentSubContentType: subContentType,
              FileName: "",
              DocumentURL: "",
            }),
          });

          const data = await response.json();
          if (data.statusCode === 200) {
            toast.success("Panel created");
            fetchDocuments(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
          }
        } else {
          // Delete document
          if (docId) {
            const response = await fetch(`${BASE_URL}/Ongoing/DeleteOngoingDocumentPanel?id=${docId}`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            });

            const data = await response.json();
            if (data.statusCode === 200) {
              toast.success("Panel removed");
              setDocuments((prev) => {
                const newDocs = { ...prev };
                delete newDocs[key];
                return newDocs;
              });
            }
          }
        }
      } catch (error) {
        console.error("Error updating checkbox:", error);
        toast.error("Failed to update");
        setCheckedStates((prev) => ({ ...prev, [key]: !isChecked }));
      }
    };
  };

  const handleImageUpload = (contentType, subContentType, fileName) => {
    return async (event) => {
    const file = event.target.files[0];
    if (!file || !inquiry) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.ongoingInquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", contentType);
      formData.append("DocumentSubContentType", subContentType);
      formData.append("FileName", fileName);

      const response = await fetch(`${BASE_URL}/AWS/OngoingDocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Image uploaded successfully");
        fetchDocuments(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
      } else {
        toast.error(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
    };
  };

  const handleRemoveImage = async (docId, contentType, subContentType) => {
    if (!docId || !inquiry) return;

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/DeleteOngoingDocumentPanel?id=${docId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Image removed");
        const key = `${contentType}_${subContentType}`;
        setDocuments((prev) => {
          const newDocs = { ...prev };
          delete newDocs[key];
          return newDocs;
        });
        setCheckedStates((prev) => ({ ...prev, [key]: false }));
      } else {
        toast.error(data.message || "Failed to remove image");
      }
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image");
    }
  };

  const getDocument = (contentType, subContentType) => {
    const key = `${contentType}_${subContentType}`;
    return documents[key] || null;
  };

  const isChecked = (contentType, subContentType) => {
    const key = `${contentType}_${subContentType}`;
    return checkedStates[key] || false;
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
      {uploading && <UploadingScreen />}

      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        windowType={inquiry ? inquiry.windowType : null}
        href="/quotations/tech-pack/"
        link="Tech Pack"
        title={`Document Panel - ${windowTypeName}`}
      />

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Document Panel</Typography>
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

        {DOCUMENT_PANELS.map((panel) => (
          <Grid item xs={12} key={panel.contentType}>
            <Card
              sx={{
                boxShadow: "none",
                borderRadius: "10px",
                p: "20px",
                mb: "15px",
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={2}>
                {panel.name}
              </Typography>
              <Grid container spacing={2}>
                {SUB_CONTENT_TYPES.map((subType) => {
                  const doc = getDocument(panel.contentType, subType.id);
                  const checked = isChecked(panel.contentType, subType.id);
                  const hasImage = doc && doc.documentURL;

                  return (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={subType.id}>
                      <Card
                        sx={{
                          boxShadow: "none",
                          border: "1px solid #e0e0e0",
                          borderRadius: "10px",
                          p: "15px",
                          height: "100%",
                          position: "relative",
                          backgroundImage: hasImage
                            ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${doc.documentURL})`
                            : "none",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          minHeight: "200px",
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={checked}
                                onChange={(event) => {
                                  const isChecked = event.target.checked;
                                  const key = `${panel.contentType}_${subType.id}`;
                                  
                                  setCheckedStates((prev) => ({ ...prev, [key]: isChecked }));

                                  if (!inquiry) return;

                                  if (isChecked) {
                                    // Create document without URL
                                    fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingDocumentPanel`, {
                                      method: "POST",
                                      headers: {
                                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        Id: 0,
                                        InquiryID: inquiry.ongoingInquiryId,
                                        InqCode: inquiry.inquiryCode,
                                        OptionId: inquiry.optionId,
                                        WindowType: inquiry.windowType,
                                        DocumentType: 4,
                                        DocumentContentType: panel.contentType,
                                        DocumentSubContentType: subType.id,
                                        FileName: "",
                                        DocumentURL: "",
                                      }),
                                    })
                                      .then((response) => response.json())
                                      .then((data) => {
                                        if (data.statusCode === 200) {
                                          toast.success("Panel created");
                                          fetchDocuments(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
                                        } else {
                                          toast.error(data.message || "Failed to create");
                                          setCheckedStates((prev) => ({ ...prev, [key]: false }));
                                        }
                                      })
                                      .catch((error) => {
                                        console.error("Error updating checkbox:", error);
                                        toast.error("Failed to update");
                                        setCheckedStates((prev) => ({ ...prev, [key]: false }));
                                      });
                                  } else {
                                    // Delete document
                                    if (doc?.id) {
                                      fetch(`${BASE_URL}/Ongoing/DeleteOngoingDocumentPanel?id=${doc.id}`, {
                                        method: "POST",
                                        headers: {
                                          Authorization: `Bearer ${localStorage.getItem("token")}`,
                                          "Content-Type": "application/json",
                                        },
                                      })
                                        .then((response) => response.json())
                                        .then((data) => {
                                          if (data.statusCode === 200) {
                                            toast.success("Panel removed");
                                            setDocuments((prev) => {
                                              const newDocs = { ...prev };
                                              delete newDocs[key];
                                              return newDocs;
                                            });
                                          } else {
                                            toast.error(data.message || "Failed to delete");
                                            setCheckedStates((prev) => ({ ...prev, [key]: true }));
                                          }
                                        })
                                        .catch((error) => {
                                          console.error("Error deleting:", error);
                                          toast.error("Failed to delete");
                                          setCheckedStates((prev) => ({ ...prev, [key]: true }));
                                        });
                                    }
                                  }
                                }}
                              />
                            }
                            label={<Typography fontWeight="bold">{subType.name}</Typography>}
                          />
                          {hasImage && <ViewImage imageURL={doc.documentURL} />}
                        </Box>

                        {!hasImage && (
                          <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            height="80px"
                            mb={2}
                          >
                            <Typography color="textSecondary" fontSize="12px">
                              No image uploaded
                            </Typography>
                          </Box>
                        )}

                        {checked && (
                          <Box mt={1}>
                            <input
                              type="file"
                              id={`file_${panel.contentType}_${subType.id}`}
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(event) => {
                                const file = event.target.files[0];
                                if (!file || !inquiry) return;

                                setUploading(true);
                                const formData = new FormData();
                                formData.append("File", file);
                                formData.append("InquiryID", inquiry.ongoingInquiryId);
                                formData.append("InqCode", inquiry.inquiryCode);
                                formData.append("WindowType", inquiry.windowType);
                                formData.append("OptionId", inquiry.optionId);
                                formData.append("DocumentType", 4);
                                formData.append("DocumentContentType", panel.contentType);
                                formData.append("DocumentSubContentType", subType.id);
                                formData.append("FileName", `${panel.name}_${subType.name}.png`);

                                fetch(`${BASE_URL}/AWS/OngoingDocumentUpload`, {
                                  method: "POST",
                                  headers: {
                                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                                  },
                                  body: formData,
                                })
                                  .then((response) => response.json())
                                  .then((data) => {
                                    if (data.statusCode === 200) {
                                      toast.success("Image uploaded successfully");
                                      fetchDocuments(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
                                    } else {
                                      toast.error(data.message || "Failed to upload image");
                                    }
                                  })
                                  .catch((error) => {
                                    console.error("Error uploading image:", error);
                                    toast.error("Failed to upload image");
                                  })
                                  .finally(() => {
                                    setUploading(false);
                                  });
                              }}
                            />
                            <label htmlFor={`file_${panel.contentType}_${subType.id}`}>
                              <Button
                                fullWidth
                                variant="contained"
                                component="span"
                                size="small"
                              >
                                {hasImage ? "Change Image" : "Add Image"}
                              </Button>
                            </label>
                            {hasImage && (
                              <Box mt={1} display="flex" justifyContent="center">
                                <Tooltip title="Remove Image" placement="top">
                                  <IconButton
                                    onClick={() => handleRemoveImage(doc.id, panel.contentType, subType.id)}
                                    aria-label="delete"
                                    size="small"
                                  >
                                    <DeleteIcon color="error" fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}

import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
} from "@mui/material";
import ViewImage from "@/components/UIElements/Modal/ViewImage";
import BASE_URL from "Base/api";
import AddFileRemark from "@/components/utils/AddFileRemark";
import DeleteIcon from '@mui/icons-material/Delete';

export default function LSideDocument({ inquiry, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const [lsideImage, setLSideImage] = useState(null);
  const [lsideEMBImage, setLSideEMBImage] = useState(null);
  const [lsideSUBImage, setLSideSUBImage] = useState(null);
  const [lsideSPrintImage, setLSideSPrintImage] = useState(null);
  const [lsideDTFImage, setLSideDTFImage] = useState(null);

  const [lsideImageID, setLSideImageID] = useState(null);
  const [lsideEMBImageID, setLSideEMBImageID] = useState(null);
  const [lsideSUBImageID, setLSideSUBImageID] = useState(null);
  const [lsideSPrintImageID, setLSideSPrintImageID] = useState(null);
  const [lsideDTFImageID, setLSideDTFImageID] = useState(null);

  const [isLSideChecked, setIsLSideChecked] = useState(false);
  const [isLSideEMBChecked, setIsLSideEMBChecked] = useState(false);
  const [isLSideSUBChecked, setIsLSideSUBChecked] = useState(false);
  const [isLSideSPrintChecked, setIsLSideSPrintChecked] = useState(false);
  const [isLSideDTFChecked, setIsLSideDTFChecked] = useState(false);

  const fetchDocuments = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/AWS/GetAllDocumentsByOption?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Neck Body List");
      }
      const data = await response.json();
      const resultLSide = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 7 &&
          item.documentSubContentType === 5
      );
      const resultLSideEMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 7 &&
          item.documentSubContentType === 1
      );
      const resultLSideSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 7 &&
          item.documentSubContentType === 2
      );
      const resultLSideSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 7 &&
          item.documentSubContentType === 3
      );
      const resultLSideDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 7 &&
          item.documentSubContentType === 4
      );
      if (resultLSide) {
        setIsLSideChecked(true);
        setLSideImage(resultLSide.documentURL);
        setLSideImageID(resultLSide.id);
      }
      if (resultLSideEMB) {
        setIsLSideEMBChecked(true);
        setLSideEMBImage(resultLSideEMB.documentURL);
        setLSideEMBImageID(resultLSideEMB.id);
      }
      if (resultLSideSUB) {
        setIsLSideSUBChecked(true);
        setLSideSUBImage(resultLSideSUB.documentURL);
        setLSideSUBImageID(resultLSideSUB.id);
      }
      if (resultLSideSPrint) {
        setIsLSideSPrintChecked(true);
        setLSideSPrintImage(resultLSideSPrint.documentURL);
        setLSideSPrintImageID(resultLSideSPrint.id);
      }
      if (resultLSideDTF) {
        setIsLSideDTFChecked(true);
        setLSideDTFImage(resultLSideDTF.documentURL);
        setLSideDTFImageID(resultLSideDTF.id);
      }
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    if (inquiry) {
      fetchDocuments(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    }
    if (onUpload) {
      onUpload(uploading);
    }
  }, [inquiry, uploading]);

  const handleLSideCheckboxChange = async (event, id) => {
    setIsLSideChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 7,
          DocumentSubContentType: 5,
        };

        const response = await fetch(
          `${BASE_URL}/AWS/CreateDocumentWithoutURL`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );


      } catch (error) {
        console.error("Error uploading PDF:", error);
      }
    } else {
      const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    }
  };
  const handleLSideEMBCheckboxChange = async (event, id) => {
    setIsLSideEMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 7,
          DocumentSubContentType: 1,
        };

        const response = await fetch(
          `${BASE_URL}/AWS/CreateDocumentWithoutURL`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );


      } catch (error) {
        console.error("Error uploading PDF:", error);
      }
    } else {
      const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    }
  };
  const handleLSideSUBCheckboxChange = async (event, id) => {
    setIsLSideSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 7,
          DocumentSubContentType: 2,
        };

        const response = await fetch(
          `${BASE_URL}/AWS/CreateDocumentWithoutURL`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );


      } catch (error) {
        console.error("Error uploading PDF:", error);
      }
    } else {
      const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    }
  };
  const handleLSideSPrintCheckboxChange = async (event, id) => {
    setIsLSideSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 7,
          DocumentSubContentType: 3,
        };

        const response = await fetch(
          `${BASE_URL}/AWS/CreateDocumentWithoutURL`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );


      } catch (error) {
        console.error("Error uploading PDF:", error);
      }
    } else {
      const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    }
  };
  const handleLSideDTFCheckboxChange = async (event, id) => {
    setIsLSideDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 7,
          DocumentSubContentType: 4,
        };

        const response = await fetch(
          `${BASE_URL}/AWS/CreateDocumentWithoutURL`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );


      } catch (error) {
        console.error("Error uploading PDF:", error);
      }
    } else {
      const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    }
  };

  const handleLSideImageUpload = async (event) => {
    const file = event.target.files[0];
    setLSideImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 7);
      formData.append("DocumentSubContentType", 5);
      formData.append("FileName", `LSide.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    } finally {
      setUploading(false);
    }
  };
  const handleRemoveLSideImage = async (id) => {
    setLSideImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleLSideEMBImageUpload = async (event) => {
    const file = event.target.files[0];
    setLSideEMBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 7);
      formData.append("DocumentSubContentType", 1);
      formData.append("FileName", `LSideEMB.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    } finally {
      setUploading(false);
    }
  };
  const handleRemoveLSideEMBImage = async (id) => {
    setLSideEMBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleLSideSUBImageUpload = async (event) => {
    const file = event.target.files[0];
    setLSideSUBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 7);
      formData.append("DocumentSubContentType", 2);
      formData.append("FileName", `LSideSUB.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    } finally {
      setUploading(false);
    }
  };
  const handleRemoveLSideSUBImage = async (id) => {
    setLSideSUBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleLSideSPrintImageUpload = async (event) => {
    const file = event.target.files[0];
    setLSideSPrintImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 7);
      formData.append("DocumentSubContentType", 3);
      formData.append("FileName", `LSideSPrint.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    } finally {
      setUploading(false);
    }
  };
  const handleRemoveLSideSPrintImage = async (id) => {
    setLSideSPrintImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleLSideDTFImageUpload = async (event) => {
    const file = event.target.files[0];
    setLSideDTFImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 7);
      formData.append("DocumentSubContentType", 4);
      formData.append("FileName", `LSideDTF.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    } finally {
      setUploading(false);
    }
  };
  const handleRemoveLSideDTFImage = async (id) => {
    setLSideDTFImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  return (
    <>
      <Grid item xs={12}>
        <Grid container>
          <Grid mt={2} item xs={12}>
            <Grid container spacing={1}>
              <Grid item xs={12} lg={3}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: lsideImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${lsideImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isLSideChecked || lsideImage ? true : false}
                          onChange={(event) => handleLSideCheckboxChange(event, lsideImageID)}
                        />
                      }
                    />
                    <ViewImage imageURL={lsideImage} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    L Side
                  </Typography>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="lsideImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLSideImageUpload}
                    />
                    <label htmlFor="lsideImage">
                      <Button
                        disabled={!isLSideChecked && !lsideImage}
                        fullWidth
                        variant="contained"
                        component="span"
                      >
                        {lsideImage ? "Change Image" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={lsideImageID} checked={isLSideChecked} />
                      <Tooltip onClick={() => handleRemoveLSideImage(lsideImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isLSideChecked && !lsideImage} aria-label="edit">
                            <DeleteIcon color={isLSideChecked ? "error" : ""} fontSize="medium" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={1}></Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: lsideEMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${lsideEMBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isLSideEMBChecked || lsideEMBImage ? true : false}
                          onChange={(event) => handleLSideEMBCheckboxChange(event, lsideEMBImageID)}
                        />
                      }
                      label="EMB"
                    />
                    <ViewImage imageURL={lsideEMBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="lsideEMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLSideEMBImageUpload}
                    />
                    <label htmlFor="lsideEMBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isLSideEMBChecked && !lsideEMBImage}
                      >
                        {lsideEMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={lsideEMBImageID} checked={isLSideEMBChecked} />
                      <Tooltip onClick={() => handleRemoveLSideEMBImage(lsideEMBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isLSideEMBChecked && !lsideEMBImage} aria-label="edit">
                            <DeleteIcon color={isLSideEMBChecked ? "error" : ""} fontSize="medium" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: lsideSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${lsideSUBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isLSideSUBChecked || lsideSUBImage ? true : false}
                          onChange={(event) => handleLSideSUBCheckboxChange(event, lsideSUBImageID)}
                        />
                      }
                      label="SUB"
                    />
                    <ViewImage imageURL={lsideSUBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="lsideSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLSideSUBImageUpload}
                    />
                    <label htmlFor="lsideSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isLSideSUBChecked && !lsideSUBImage}
                      >
                        {lsideSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>

                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={lsideSUBImageID} checked={isLSideSUBChecked} />
                      <Tooltip onClick={() => handleRemoveLSideSUBImage(lsideSUBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isLSideSUBChecked && !lsideSUBImage} aria-label="edit">
                            <DeleteIcon color={isLSideSUBChecked ? "error" : ""} fontSize="medium" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: lsideSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${lsideSPrintImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isLSideSPrintChecked || lsideSPrintImage ? true : false}
                          onChange={(event) => handleLSideSPrintCheckboxChange(event, lsideSPrintImageID)}
                        />
                      }
                      label="S Print"
                    />
                    <ViewImage imageURL={lsideSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="lsideSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLSideSPrintImageUpload}
                    />
                    <label htmlFor="lsideSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={
                          !isLSideSPrintChecked && !lsideSPrintImage
                        }
                      >
                        {lsideSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={lsideSPrintImageID} checked={isLSideSPrintChecked} />
                      <Tooltip onClick={() => handleRemoveLSideSPrintImage(lsideSPrintImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isLSideSPrintChecked && !lsideSPrintImage} aria-label="edit">
                            <DeleteIcon color={isLSideSPrintChecked ? "error" : ""} fontSize="medium" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: lsideDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${lsideDTFImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isLSideDTFChecked || lsideDTFImage ? true : false}
                          onChange={(event) => handleLSideDTFCheckboxChange(event, lsideDTFImageID)}
                        />
                      }
                      label="DTF"
                    />
                    <ViewImage imageURL={lsideDTFImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="lsideDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLSideDTFImageUpload}
                    />
                    <label htmlFor="lsideDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isLSideDTFChecked && !lsideDTFImage}
                      >
                        {lsideDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={lsideDTFImageID} checked={isLSideDTFChecked} />
                      <Tooltip onClick={() => handleRemoveLSideDTFImage(lsideDTFImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isLSideDTFChecked && !lsideDTFImage} aria-label="edit">
                            <DeleteIcon color={isLSideDTFChecked ? "error" : ""} fontSize="medium" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}

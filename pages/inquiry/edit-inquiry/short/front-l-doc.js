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

export default function FrontLDocument({ inquiry, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const [frontLImage, setFrontLImage] = useState(null);
  const [frontLEMBImage, setFrontLEMBImage] = useState(null);
  const [frontLSUBImage, setFrontLSUBImage] = useState(null);
  const [frontLSPrintImage, setFrontLSPrintImage] = useState(null);
  const [frontLDTFImage, setFrontLDTFImage] = useState(null);

  const [frontLImageID, setFrontLImageID] = useState();
  const [frontLEMBImageID, setFrontLEMBImageID] = useState();
  const [frontLSUBImageID, setFrontLSUBImageID] = useState();
  const [frontLSPrintImageID, setFrontLSPrintImageID] = useState();
  const [frontLDTFImageID, setFrontLDTFImageID] = useState();

  const [isFrontLChecked, setIsFrontLChecked] = useState(false);
  const [isFrontLEMBChecked, setIsFrontLEMBChecked] = useState(false);
  const [isFrontLSUBChecked, setIsFrontLSUBChecked] = useState(false);
  const [isFrontLSPrintChecked, setIsFrontLSPrintChecked] = useState(false);
  const [isFrontLDTFChecked, setIsFrontLDTFChecked] = useState(false);

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
      const resultFrontL = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 11 &&
          item.documentSubContentType === 5
      );
      const resultFrontLEMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 11 &&
          item.documentSubContentType === 1
      );
      const resultFrontLSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 11 &&
          item.documentSubContentType === 2
      );
      const resultFrontLSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 11 &&
          item.documentSubContentType === 3
      );
      const resultFrontLDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 11 &&
          item.documentSubContentType === 4
      );
      if (resultFrontL) {
        setIsFrontLChecked(true);
        setFrontLImage(resultFrontL.documentURL);
        setFrontLImageID(resultFrontL.id);
      }
      if (resultFrontLEMB) {
        setIsFrontLEMBChecked(true);
        setFrontLEMBImage(resultFrontLEMB.documentURL);
        setFrontLEMBImageID(resultFrontLEMB.id);
      }
      if (resultFrontLSUB) {
        setIsFrontLSUBChecked(true);
        setFrontLSUBImage(resultFrontLSUB.documentURL);
        setFrontLSUBImageID(resultFrontLSUB.id);
      }
      if (resultFrontLSPrint) {
        setIsFrontLSPrintChecked(true);
        setFrontLSPrintImage(resultFrontLSPrint.documentURL);
        setFrontLSPrintImageID(resultFrontLSPrint.id);
      }
      if (resultFrontLDTF) {
        setIsFrontLDTFChecked(true);
        setFrontLDTFImage(resultFrontLDTF.documentURL);
        setFrontLDTFImageID(resultFrontLDTF.id);
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

  const handleFrontLCheckboxChange = async (event, id) => {
    setIsFrontLChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 11,
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
  const handleFrontLEMBCheckboxChange = async (event, id) => {
    setIsFrontLEMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 11,
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
  const handleFrontLSUBCheckboxChange = async (event, id) => {
    setIsFrontLSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 11,
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
  const handleFrontLSPrintCheckboxChange = async (event, id) => {
    setIsFrontLSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 11,
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
  const handleFrontLDTFCheckboxChange = async (event, id) => {
    setIsFrontLDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 11,
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

  //fornt image start
  const handleFrontLImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontLImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 11);
      formData.append("DocumentSubContentType", 5);
      formData.append("FileName", `FrontL.png`);

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
  const handleRemoveFrontLImage = async (id) => {
    setFrontLImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //frontL image end

  //fron EMB start
  const handleFrontLEMBImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontLEMBImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 11);
      formData.append("DocumentSubContentType", 1);
      formData.append("FileName", `FrontLEMB.png`);

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
  const handleRemoveFrontLEMBImage = async (id) => {
    setFrontLEMBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //frontL EMB end

  //frontL sub start
  const handleFrontLSUBImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontLSUBImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 11);
      formData.append("DocumentSubContentType", 2);
      formData.append("FileName", `FrontLSUB.png`);

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
  const handleRemoveFrontLSUBImage = async (id) => {
    setFrontLSUBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //frontL SUB end

  //frontL s print start
  const handleFrontLSPrintImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontLSPrintImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 11);
      formData.append("DocumentSubContentType", 3);
      formData.append("FileName", `FrontLSPrint.png`);

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
  const handleRemoveFrontLSPrintImage = async (id) => {
    setFrontLSPrintImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //frontL s print end

  //frontL dtf start
  const handleFrontLDTFImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontLDTFImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 11);
      formData.append("DocumentSubContentType", 4);
      formData.append("FileName", `FrontLDTF.png`);

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
  const handleRemoveFrontLDTFImage = async (id) => {
    setFrontLDTFImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };

  //frontL dtf end
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
                    backgroundImage: frontLImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontLImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isFrontLChecked || frontLImage ? true : false}
                          onChange={(event) => handleFrontLCheckboxChange(event, frontLImageID)}
                        />
                      }
                    />
                    <ViewImage imageURL={frontLImage} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    Front L
                  </Typography>

                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontLImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontLImageUpload}
                    />
                    <label htmlFor="frontLImage">
                      <Button
                        disabled={!isFrontLChecked && !frontLImage}
                        fullWidth
                        variant="contained"
                        component="span"
                      >
                        {frontLImage ? "Change Image" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontLImageID} checked={isFrontLChecked} />
                      <Tooltip onClick={() => handleRemoveFrontLImage(frontLImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontLChecked && !frontLImage} aria-label="edit">
                            <DeleteIcon color={isFrontLChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: frontLEMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontLEMBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            isFrontLEMBChecked || frontLEMBImage ? true : false
                          }
                          onChange={(event) => handleFrontLEMBCheckboxChange(event, frontLEMBImageID)}
                        />
                      }
                      label="EMB"
                    />
                    <ViewImage imageURL={frontLEMBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontLEMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontLEMBImageUpload}
                    />
                    <label htmlFor="frontLEMBImage">
                      <Button
                        fullWidth
                        disabled={!isFrontLEMBChecked && !frontLEMBImage}
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                      >
                        {frontLEMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontLEMBImageID} checked={isFrontLEMBChecked} />
                      <Tooltip onClick={() => handleRemoveFrontLEMBImage(frontLEMBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontLEMBChecked && !frontLEMBImage} aria-label="edit">
                            <DeleteIcon color={isFrontLEMBChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: frontLSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontLSUBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={<Checkbox />}
                      checked={
                        isFrontLSUBChecked || frontLSUBImage ? true : false
                      }
                      onChange={(event) => handleFrontLSUBCheckboxChange(event, frontLSUBImageID)}
                      label="SUB"
                    />
                    <ViewImage imageURL={frontLSUBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontLSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontLSUBImageUpload}
                    />
                    <label htmlFor="frontLSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        disabled={!isFrontLSUBChecked && !frontLSUBImage}
                        component="span"
                      >
                        {frontLSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontLSUBImageID} checked={isFrontLSUBChecked} />
                      <Tooltip onClick={() => handleRemoveFrontLSUBImage(frontLSUBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontLSUBChecked && !frontLSUBImage} aria-label="edit">
                            <DeleteIcon color={isFrontLSUBChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: frontLSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontLSPrintImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            isFrontLSPrintChecked || frontLSPrintImage
                              ? true
                              : false
                          }
                          onChange={(event) => handleFrontLSPrintCheckboxChange(event, frontLSPrintImageID)}
                        />
                      }
                      label="S Print"
                    />
                    <ViewImage imageURL={frontLSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontLSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontLSPrintImageUpload}
                    />
                    <label htmlFor="frontLSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isFrontLSPrintChecked && !frontLSPrintImage}
                      >
                        {frontLSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontLSPrintImageID} checked={isFrontLSPrintChecked} />
                      <Tooltip onClick={() => handleRemoveFrontLSPrintImage(frontLSPrintImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontLSPrintChecked && !frontLSPrintImage} aria-label="edit">
                            <DeleteIcon color={isFrontLSPrintChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: frontLDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontLDTFImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            isFrontLDTFChecked || frontLDTFImage ? true : false
                          }
                          onChange={(event) => handleFrontLDTFCheckboxChange(event, frontLDTFImageID)}
                        />
                      }
                      label="DTF"
                    />
                    <ViewImage imageURL={frontLDTFImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontLDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontLDTFImageUpload}
                    />
                    <label htmlFor="frontLDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isFrontLDTFChecked && !frontLDTFImage}
                      >
                        {frontLDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontLDTFImageID} checked={isFrontLDTFChecked} />
                      <Tooltip onClick={() => handleRemoveFrontLDTFImage(frontLDTFImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontLDTFChecked && !frontLDTFImage} aria-label="edit">
                            <DeleteIcon color={isFrontLDTFChecked ? "error" : ""} fontSize="medium" />
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

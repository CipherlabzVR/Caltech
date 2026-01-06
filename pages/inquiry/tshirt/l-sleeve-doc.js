import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ViewImage from "@/components/UIElements/Modal/ViewImage";
import BASE_URL from "Base/api";

export default function LSleeveDocument() {
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));

  const [lsleeveImage, setLSleeveImage] = useState(null);
  const [lsleeveEMBImage, setLSleeveEMBImage] = useState(null);
  const [lsleeveSUBImage, setLSleeveSUBImage] = useState(null);
  const [lsleeveSPrintImage, setLSleeveSPrintImage] = useState(null);
  const [lsleeveDTFImage, setLSleeveDTFImage] = useState(null);

  const [lsleeveImageID, setLSleeveImageID] = useState(null);
  const [lsleeveEMBImageID, setLSleeveEMBImageID] = useState(null);
  const [lsleeveSUBImageID, setLSleeveSUBImageID] = useState(null);
  const [lsleeveSPrintImageID, setLSleeveSPrintImageID] = useState(null);
  const [lsleeveDTFImageID, setLSleeveDTFImageID] = useState(null);

  const [isLSleeveChecked, setIsLSleeveChecked] = useState(false);
  const [isLSleeveEMBChecked, setIsLSleeveEMBChecked] = useState(false);
  const [isLSleeveSUBChecked, setIsLSleeveSUBChecked] = useState(false);
  const [isLSleeveSPrintChecked, setIsLSleeveSPrintChecked] = useState(false);
  const [isLSleeveDTFChecked, setIsLSleeveDTFChecked] = useState(false);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/AWS/GetAllDocumentsByOption?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
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
      const resultLSleeve = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 4 &&
          item.documentSubContentType === 5
      );
      const resultLSleeveEMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 4 &&
          item.documentSubContentType === 1
      );
      const resultLSleeveSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 4 &&
          item.documentSubContentType === 2
      );
      const resultLSleeveSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 4 &&
          item.documentSubContentType === 3
      );
      const resultLSleeveDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 4 &&
          item.documentSubContentType === 4
      );
      if (resultLSleeve) {
        setIsLSleeveChecked(true);
        setLSleeveImage(resultLSleeve.documentURL);
        setLSleeveImageID(resultLSleeve.id);
      }
      if (resultLSleeveEMB) {
        setIsLSleeveEMBChecked(true);
        setLSleeveEMBImage(resultLSleeveEMB.documentURL);
        setLSleeveEMBImageID(resultLSleeveEMB.id);
      }
      if (resultLSleeveSUB) {
        setIsLSleeveSUBChecked(true);
        setLSleeveSUBImage(resultLSleeveSUB.documentURL);
        setLSleeveSUBImageID(resultLSleeveSUB.id);
      }
      if (resultLSleeveSPrint) {
        setIsLSleeveSPrintChecked(true);
        setLSleeveSPrintImage(resultLSleeveSPrint.documentURL);
        setLSleeveSPrintImageID(resultLSleeveSPrint.id);
      }
      if (resultLSleeveDTF) {
        setIsLSleeveDTFChecked(true);
        setLSleeveDTFImage(resultLSleeveDTF.documentURL);
        setLSleeveDTFImageID(resultLSleeveDTF.id);
      }
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleLSleeveCheckboxChange = async (event,id) => {
    setIsLSleeveChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 4,
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
  const handleLSleeveEMBCheckboxChange = async (event,id) => {
    setIsLSleeveEMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 4,
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
  const handleLSleeveSUBCheckboxChange = async (event,id) => {
    setIsLSleeveSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 4,
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
  const handleLSleeveSPrintCheckboxChange = async (event,id) => {
    setIsLSleeveSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 4,
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
  const handleLSleeveDTFCheckboxChange = async (event,id) => {
    setIsLSleeveDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 4,
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

  const handleLSleeveImageUpload = async (event) => {
    const file = event.target.files[0];
    setLSleeveImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 4);
      formData.append("DocumentSubContentType", 5);
      formData.append("FileName", `LSleeve.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };
  const handleRemoveLSleeveImage = async (id) => {
    setLSleeveImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleLSleeveEMBImageUpload = async (event) => {
    const file = event.target.files[0];
    setLSleeveEMBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 4);
      formData.append("DocumentSubContentType", 1);
      formData.append("FileName", `LSleeveEMB.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };
  const handleRemoveLSleeveEMBImage = async (id) => {
    setLSleeveEMBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleLSleeveSUBImageUpload = async (event) => {
    const file = event.target.files[0];
    setLSleeveSUBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 4);
      formData.append("DocumentSubContentType", 2);
      formData.append("FileName", `LSleeveSUB.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };
  const handleRemoveLSleeveSUBImage = async (id) => {
    setLSleeveSUBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleLSleeveSPrintImageUpload = async (event) => {
    const file = event.target.files[0];
    setLSleeveSPrintImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 4);
      formData.append("DocumentSubContentType", 3);
      formData.append("FileName", `LSleeveSPrint.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };
  const handleRemoveLSleeveSPrintImage = async (id) => {
    setLSleeveSPrintImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleLSleeveDTFImageUpload = async (event) => {
    const file = event.target.files[0];
    setLSleeveDTFImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 4);
      formData.append("DocumentSubContentType", 4);
      formData.append("FileName", `LSleeveDTF.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };
  const handleRemoveLSleeveDTFImage = async (id) => {
    setLSleeveDTFImage(null);
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
            <Grid container mt={2}>
              <Grid item xs={12} lg={3}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    mb: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: lsleeveImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${lsleeveImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isLSleeveChecked || lsleeveImage ? true : false}
                          onChange={(event) =>handleLSleeveCheckboxChange(event,lsleeveImageID)}
                        />
                      }
                    />
                    <ViewImage imageURL={lsleeveImage} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    L Sleeve
                  </Typography>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="lsleeveImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLSleeveImageUpload}
                    />
                    <label htmlFor="lsleeveImage">
                      <Button
                        disabled={!isLSleeveChecked && !lsleeveImage}
                        fullWidth
                        variant="contained"
                        component="span"
                      >
                        {lsleeveImage ? "Change Image" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      color="error"
                      variant="outlined"
                      onClick={() => handleRemoveLSleeveImage(lsleeveImageID)}
                      disabled={!isLSleeveChecked && !lsleeveImage}
                    >
                      Remove
                    </Button>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={1}></Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    mb: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: lsleeveEMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${lsleeveEMBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isLSleeveEMBChecked || lsleeveEMBImage ? true : false}
                          onChange={(event) =>handleLSleeveEMBCheckboxChange(event,lsleeveEMBImageID)}
                        />
                      }
                      label="EMB"
                    />
                    <ViewImage imageURL={lsleeveEMBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="lsleeveEMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLSleeveEMBImageUpload}
                    />
                    <label htmlFor="lsleeveEMBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isLSleeveEMBChecked && !lsleeveEMBImage}
                      >
                        {lsleeveEMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      color="error"
                      variant="outlined"
                      onClick={() =>
                        handleRemoveLSleeveEMBImage(lsleeveEMBImageID)
                      }
                      disabled={!isLSleeveEMBChecked && !lsleeveEMBImage}
                    >
                      Remove
                    </Button>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    mb: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: lsleeveSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${lsleeveSUBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isLSleeveSUBChecked || lsleeveSUBImage ? true : false}
                          onChange={(event) =>handleLSleeveSUBCheckboxChange(event,lsleeveSUBImageID)}
                        />
                      }
                      label="SUB"
                    />
                    <ViewImage imageURL={lsleeveSUBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="lsleeveSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLSleeveSUBImageUpload}
                    />
                    <label htmlFor="lsleeveSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isLSleeveSUBChecked && !lsleeveSUBImage}
                      >
                        {lsleeveSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() =>
                        handleRemoveLSleeveSUBImage(lsleeveSUBImageID)
                      }
                      disabled={!isLSleeveSUBChecked && !lsleeveSUBImage}
                    >
                      Remove
                    </Button>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    mb: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: lsleeveSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${lsleeveSPrintImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isLSleeveSPrintChecked || lsleeveSPrintImage ? true : false}
                          onChange={(event) =>handleLSleeveSPrintCheckboxChange(event,lsleeveSPrintImageID)}
                        />
                      }
                      label="S Print"
                    />
                    <ViewImage imageURL={lsleeveSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="lsleeveSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLSleeveSPrintImageUpload}
                    />
                    <label htmlFor="lsleeveSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={
                          !isLSleeveSPrintChecked && !lsleeveSPrintImage
                        }
                      >
                        {lsleeveSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() =>
                        handleRemoveLSleeveSPrintImage(lsleeveSPrintImageID)
                      }
                      disabled={!isLSleeveSPrintChecked && !lsleeveSPrintImage}
                    >
                      Remove
                    </Button>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    mb: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: lsleeveDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${lsleeveDTFImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isLSleeveDTFChecked || lsleeveDTFImage ? true : false}
                          onChange={(event) =>handleLSleeveDTFCheckboxChange(event,lsleeveDTFImageID)}
                        />
                      }
                      label="DTF"
                    />
                    <ViewImage imageURL={lsleeveDTFImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="lsleeveDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLSleeveDTFImageUpload}
                    />
                    <label htmlFor="lsleeveDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isLSleeveDTFChecked && !lsleeveDTFImage}
                      >
                        {lsleeveDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() =>
                        handleRemoveLSleeveDTFImage(lsleeveDTFImageID)
                      }
                      disabled={!isLSleeveDTFChecked && !lsleeveDTFImage}
                    >
                      Remove
                    </Button>
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

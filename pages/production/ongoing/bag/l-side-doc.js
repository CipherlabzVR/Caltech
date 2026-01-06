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

export default function LSideDocument() {
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));

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
    fetchDocuments();
  }, []);

  const handleLSideCheckboxChange = async (event,id) => {
    setIsLSideChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
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
  const handleLSideEMBCheckboxChange = async (event,id) => {
    setIsLSideEMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
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
  const handleLSideSUBCheckboxChange = async (event,id) => {
    setIsLSideSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
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
  const handleLSideSPrintCheckboxChange = async (event,id) => {
    setIsLSideSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
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
  const handleLSideDTFCheckboxChange = async (event,id) => {
    setIsLSideDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
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
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
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
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
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
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
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
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
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
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
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
                          onChange={(event) =>handleLSideCheckboxChange(event,lsideImageID)}
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
                    <Button
                      fullWidth
                      color="error"
                      variant="outlined"
                      onClick={() => handleRemoveLSideImage(lsideImageID)}
                      disabled={!isLSideChecked && !lsideImage}
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
                          onChange={(event) =>handleLSideEMBCheckboxChange(event,lsideEMBImageID)}
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
                    <Button
                      fullWidth
                      color="error"
                      variant="outlined"
                      onClick={() =>
                        handleRemoveLSideEMBImage(lsideEMBImageID)
                      }
                      disabled={!isLSideEMBChecked && !lsideEMBImage}
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
                          onChange={(event) =>handleLSideSUBCheckboxChange(event,lsideSUBImageID)}
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
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() =>
                        handleRemoveLSideSUBImage(lsideSUBImageID)
                      }
                      disabled={!isLSideSUBChecked && !lsideSUBImage}
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
                          onChange={(event) =>handleLSideSPrintCheckboxChange(event,lsideSPrintImageID)}
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
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() =>
                        handleRemoveLSideSPrintImage(lsideSPrintImageID)
                      }
                      disabled={!isLSideSPrintChecked && !lsideSPrintImage}
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
                          onChange={(event) =>handleLSideDTFCheckboxChange(event,lsideDTFImageID)}
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
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() =>
                        handleRemoveLSideDTFImage(lsideDTFImageID)
                      }
                      disabled={!isLSideDTFChecked && !lsideDTFImage}
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

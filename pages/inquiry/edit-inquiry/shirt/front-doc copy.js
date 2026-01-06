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
import { uploadFile } from "@/components/utils/UploadFile";
import { removeFile } from "@/components/utils/RemoveFile";
import { createDocumentWithoutURL } from "@/components/utils/DocumentWithoutFile";
import DeleteIcon from '@mui/icons-material/Delete';
import AddFileRemark from "@/components/utils/AddFileRemark";

export default function FrontDocument({ inquiry, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const [frontImage, setFrontImage] = useState(null);
  const [frontEMBImage, setFrontEMBImage] = useState(null);
  const [frontSUBImage, setFrontSUBImage] = useState(null);
  const [frontSPrintImage, setFrontSPrintImage] = useState(null);
  const [frontDTFImage, setFrontDTFImage] = useState(null);

  const [frontImageID, setFrontImageID] = useState();
  const [frontEMBImageID, setFrontEMBImageID] = useState();
  const [frontSUBImageID, setFrontSUBImageID] = useState();
  const [frontSPrintImageID, setFrontSPrintImageID] = useState();
  const [frontDTFImageID, setFrontDTFImageID] = useState();

  const [isFrontChecked, setIsFrontChecked] = useState(false);
  const [isFrontEMBChecked, setIsFrontEMBChecked] = useState(false);
  const [isFrontSUBChecked, setIsFrontSUBChecked] = useState(false);
  const [isFrontSPrintChecked, setIsFrontSPrintChecked] = useState(false);
  const [isFrontDTFChecked, setIsFrontDTFChecked] = useState(false);

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
      const resultFront = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 1 &&
          item.documentSubContentType === 5
      );
      const resultFrontEMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 1 &&
          item.documentSubContentType === 1
      );
      const resultFrontSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 1 &&
          item.documentSubContentType === 2
      );
      const resultFrontSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 1 &&
          item.documentSubContentType === 3
      );
      const resultFrontDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 1 &&
          item.documentSubContentType === 4
      );
      if (resultFront) {
        setIsFrontChecked(true);
        setFrontImage(resultFront.documentURL);
        setFrontImageID(resultFront.id);
      }
      if (resultFrontEMB) {
        setIsFrontEMBChecked(true);
        setFrontEMBImage(resultFrontEMB.documentURL);
        setFrontEMBImageID(resultFrontEMB.id);
      }
      if (resultFrontSUB) {
        setIsFrontSUBChecked(true);
        setFrontSUBImage(resultFrontSUB.documentURL);
        setFrontSUBImageID(resultFrontSUB.id);
      }
      if (resultFrontSPrint) {
        setIsFrontSPrintChecked(true);
        setFrontSPrintImage(resultFrontSPrint.documentURL);
        setFrontSPrintImageID(resultFrontSPrint.id);
      }
      if (resultFrontDTF) {
        setIsFrontDTFChecked(true);
        setFrontDTFImage(resultFrontDTF.documentURL);
        setFrontDTFImageID(resultFrontDTF.id);
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

  //handle check box change
  const handleCheckboxChange = async (event, id, subContentType, setChecked) => {
    const checked = event.target.checked;
    setChecked(checked);
    try {
      if (checked) {
        await createDocumentWithoutURL({
          inquiry,
          documentType: 4,
          documentContentType: 1,
          documentSubContentType: subContentType,
        });
      } else {
        await handleImageDelete(id, subContentType);
      }
      fetchDocuments(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    } catch (error) {
      console.error("Document action failed:", error);
    }
  };

  //document upload 
  const handleImageUpload = async (file, subContType, name) => {
    if (!file) return;

    const imageSetters = {
      1: setFrontEMBImage,
      2: setFrontSUBImage,
      3: setFrontSPrintImage,
      4: setFrontDTFImage,
      5: setFrontImage,
    };

    imageSetters[subContType]?.(URL.createObjectURL(file));

    try {
      await uploadFile({
        file,
        inquiry,
        fileName: name,
        documentType: 4,
        documentContentType: 1,
        documentSubContentType: subContType,
        onUploadStart: () => setUploading(true),
        onUploadEnd: () => setUploading(false),
      });
      fetchDocuments(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  //remove document
  const handleImageDelete = async (id, subContType) => {
    const imageSetters = {
      1: setFrontEMBImage,
      2: setFrontSUBImage,
      3: setFrontSPrintImage,
      4: setFrontDTFImage,
      5: setFrontImage,
    };

    imageSetters[subContType]?.(null);

    try {
      await removeFile({
        id
      });
      fetchDocuments(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    } catch (error) {
      console.error("Remove failed", error);
    }
  };

  return (
    <>
      <Grid item xs={12}>
        <Grid container>
          <Grid mt={2} item xs={12}>
            <Grid container mt={2} spacing={1}>
              <Grid item xs={12} lg={3}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: frontImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isFrontChecked || frontImage ? true : false}
                          onChange={(e) => handleCheckboxChange(e, frontImageID, 5, setIsFrontChecked)}
                        />
                      }
                    />
                    <ViewImage imageURL={frontImage} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    Front
                  </Typography>

                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload(e.target.files[0], 5, "Front.png")}
                    />


                    <label htmlFor="frontImage">
                      <Button
                        disabled={!isFrontChecked && !frontImage}
                        fullWidth
                        variant="contained"
                        component="span"
                      >
                        {frontImage ? "Change Image" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontImageID} checked={isFrontChecked} />
                        <Tooltip onClick={() => handleImageDelete(frontImageID, 5)} title="Remove" placement="top">
                          <span>
                            <IconButton disabled={!isFrontChecked && !frontImage} aria-label="edit">
                              <DeleteIcon color="error" fontSize="medium" />
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
                    backgroundImage: frontEMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontEMBImage})`
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
                            isFrontEMBChecked || frontEMBImage ? true : false
                          }
                          onChange={(e) => handleCheckboxChange(e, frontEMBImageID, 1, setIsFrontEMBChecked)}
                        />
                      }
                      label="EMB"
                    />
                    <ViewImage imageURL={frontEMBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontEMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload(e.target.files[0], 1, "FrontEMB.png")}
                    />
                    <label htmlFor="frontEMBImage">
                      <Button
                        fullWidth
                        disabled={!isFrontEMBChecked && !frontEMBImage}
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                      >
                        {frontEMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontEMBImageID} checked={isFrontEMBChecked} />
                      <Tooltip onClick={() => handleImageDelete(frontEMBImageID, 1)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontEMBChecked && !frontEMBImage} aria-label="edit">
                            <DeleteIcon color="error" fontSize="medium" />
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
                    backgroundImage: frontSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontSUBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={<Checkbox />}
                      checked={
                        isFrontSUBChecked || frontSUBImage ? true : false
                      }
                      onChange={(e) => handleCheckboxChange(e, frontSUBImageID, 2, setIsFrontSUBChecked)}
                      label="SUB"
                    />
                    <ViewImage imageURL={frontSUBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload(e.target.files[0], 1, "FrontSUB.png")}

                    />
                    <label htmlFor="frontSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        disabled={!isFrontSUBChecked && !frontSUBImage}
                        component="span"
                      >
                        {frontSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontSUBImageID} checked={isFrontSUBChecked} />
                      <Tooltip onClick={() => handleImageDelete(frontSUBImageID, 2)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontSUBChecked && !frontSUBImage} aria-label="edit">
                            <DeleteIcon color="error" fontSize="medium" />
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
                    backgroundImage: frontSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontSPrintImage})`
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
                            isFrontSPrintChecked || frontSPrintImage
                              ? true
                              : false
                          }
                          onChange={(e) => handleCheckboxChange(e, frontSPrintImageID, 3, setIsFrontSPrintChecked)}
                        />
                      }
                      label="S Print"
                    />
                    <ViewImage imageURL={frontSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload(e.target.files[0], 3, "FrontSPrint.png")}
                    />
                    <label htmlFor="frontSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isFrontSPrintChecked && !frontSPrintImage}
                      >
                        {frontSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>

                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontSPrintImageID} checked={isFrontSPrintChecked} />
                      <Tooltip onClick={() => handleImageDelete(frontSPrintImageID, 3)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontSPrintChecked && !frontSPrintImage} aria-label="edit">
                            <DeleteIcon color="error" fontSize="medium" />
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
                    backgroundImage: frontDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontDTFImage})`
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
                            isFrontDTFChecked || frontDTFImage ? true : false
                          }
                          onChange={(e) => handleCheckboxChange(e, frontDTFImageID, 4, setIsFrontDTFChecked)}
                        />
                      }
                      label="DTF"
                    />
                    <ViewImage imageURL={frontDTFImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload(e.target.files[0], 4, "FrontDTF.png")}
                    />
                    <label htmlFor="frontDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isFrontDTFChecked && !frontDTFImage}
                      >
                        {frontDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontDTFImageID} checked={isFrontDTFChecked} />
                      <Tooltip onClick={() => handleImageDelete(frontDTFImageID, 4)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontDTFChecked && !frontDTFImage} aria-label="edit">
                            <DeleteIcon color="error" fontSize="medium" />
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

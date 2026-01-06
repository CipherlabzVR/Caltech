import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import { Box, Button, IconButton, Modal, Typography } from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import CloseIcon from "@mui/icons-material/Close";
import DocType from "pages/inquiry/Types/docType";
import DocSubType from "pages/inquiry/Types/docSubType";
import BASE_URL from "Base/api";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  overflow: "hidden",
  overflowY: "scroll",
};

export default function DocEditImageList({inquiry}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentDocTypeIndex, setCurrentDocTypeIndex] = useState(0);
  const [currentDocSubTypeIndex, setCurrentDocSubTypeIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [docSubTypes, setDocSubTypes] = useState([]);
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
      const responseData = await response.json();
      if (!responseData.result || !Array.isArray(responseData.result)) {
        throw new Error("Data is not in the expected format");
      }
      const data = responseData.result;
      const filteredData = data.filter((item) => item.documentType !== 7);
      const documentURLs = filteredData.map((item) =>
        item.documentURL
          ? item.documentURL
          : "https://buyansewproject.s3.ap-northeast-1.amazonaws.com/Images/Image_not_available.png"
      );

      //const documentURLs = filteredData.map((item) => item.documentURL);
      const documentType = filteredData.map((item) => item.documentContentType);
      const documentSubType = filteredData.map(
        (item) => item.documentSubContentType
      );

      setImages(documentURLs);
      setDocTypes(documentType);
      setDocSubTypes(documentSubType);
    } catch (error) { }
  };

  useEffect(() => {
      if (inquiry) {
        fetchDocuments(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      }
    }, [inquiry]);

  const showPrevImage = () => {
    setCurrentImageIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    setCurrentDocTypeIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    setCurrentDocSubTypeIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const showNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      Math.min(prevIndex + 1, images.length - 1)
    );
    setCurrentDocTypeIndex((prevIndex) =>
      Math.min(prevIndex + 1, images.length - 1)
    );
    setCurrentDocSubTypeIndex((prevIndex) =>
      Math.min(prevIndex + 1, images.length - 1)
    );
  };

  return (
    <>
      <Card
        sx={{
          boxShadow: "none",
          borderRadius: "10px",
          p: "20px",
          mb: "15px",
        }}
      >
        {images.length > 0 ? (
          <>
            <Box display="flex" justifyContent="space-between">
              <IconButton onClick={showPrevImage}>
                <ArrowBackIosIcon />
              </IconButton>
              <Typography
                as="h3"
                sx={{
                  fontSize: 18,
                  fontWeight: 500,
                  mb: "10px",
                }}
              >
                <DocType type={docTypes[currentDocTypeIndex]} /> - <DocSubType type={docSubTypes[currentDocSubTypeIndex]} />
              </Typography>
              <IconButton onClick={showNextImage}>
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>

            <Box
              onClick={handleOpen}
              sx={{
                height: '25vh',
                backgroundImage: `url(${images[currentImageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </>
        ) : (
          <Typography
            as="h3"
            sx={{
              fontSize: 18,
              fontWeight: 500,
              mb: "10px",
              textAlign: "center",
            }}
          >
            No images available
          </Typography>
        )}
      </Card>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            ...style,
            width: "80%",
            maxWidth: "800px",
            maxHeight: "80vh",
            margin: "auto",
          }}
          className="bg-black"
        >
          <IconButton color="error" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
          <Card
            sx={{
              boxShadow: "none",
              borderRadius: "10px",
              p: "20px",
              mb: "15px",
            }}
          >
            <Box display="flex" justifyContent="space-between">
              <IconButton onClick={showPrevImage}>
                <ArrowBackIosIcon />
              </IconButton>
              <Typography
                as="h3"
                sx={{
                  fontSize: 18,
                  fontWeight: 500,
                  mb: "10px",
                }}
              >
                <DocType type={docTypes[currentDocTypeIndex]} /> - <DocSubType type={docSubTypes[currentDocSubTypeIndex]} />
              </Typography>
              <IconButton onClick={showNextImage}>
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>
            <Box display="flex" justifyContent="center">
              <img src={images[currentImageIndex]} alt="Image" />
            </Box>
            <Box
              onClick={handleOpen}
              sx={{
                height: '25vh',
                backgroundImage: `url(${images[currentImageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </Card>
          <Box display="flex" justifyContent="space-between">
            <Button
              variant="contained"
              color="error"
              onClick={handleClose}
              sx={{
                mt: 2,
                textTransform: "capitalize",
                borderRadius: "8px",
                fontWeight: "500",
                fontSize: "13px",
                padding: "12px 20px",
              }}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import "react-toastify/dist/ReactToastify.css";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Grid, IconButton, Tooltip, Typography } from "@mui/material";
import { toast } from "react-toastify";
import {
  ShareDocumentMessage,
  ShareDocumentURL,
} from "Base/document";
import { UploadShareURL, Report } from "Base/report";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import { Catelogue } from "Base/catelogue";
import ReportPreview from "./ReportPreview";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 400, xs: 300 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

export default function ShareReports({
  url,
  mobile
}) {
  const { data: IsGarmentSystem } = IsAppSettingEnabled("IsGarmentSystem");
  const { data: IsShareWhatsAppAPIThrough } = IsAppSettingEnabled("IsShareWhatsAppAPIThrough");
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState();

  const handleOpen = async () => {
    let now = new Date();
    let slTime = new Date(now.getTime());

    let formatted = slTime.getFullYear().toString()
      + (slTime.getMonth() + 1).toString().padStart(2, '0')
      + slTime.getDate().toString().padStart(2, '0')
      + slTime.getHours().toString().padStart(2, '0')
      + slTime.getMinutes().toString().padStart(2, '0')
      + slTime.getSeconds().toString().padStart(2, '0');

    setCode(formatted);

    try {
      setLoading(true);
      const response = await fetch(
        `${Report}` + url + `&UniqueCode=${formatted}`,
        {
          method: "GET",
          mode: "no-cors",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const text = `${ShareDocumentURL}${Catelogue}/${code}.pdf`;
      setPreview(text);
      setOpen(true);
    } catch (error) {
      console.error("Error fetching:", error);
    } finally {
      setLoading(false);
    }

  };



  const handleClose = () => setOpen(false);

  const handleOpenWhatsappTemp = (message, documentUrl) => {
    const encodedMessage = encodeURIComponent(`${message}\n\n${documentUrl}`);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const handleShareOnWhatsapp = async () => {
    if (!mobile) {
      toast.info("Customer Contact Number Not Available");
      setOpen(false);
      return;
    };

    const message = ShareDocumentMessage;
    const documentUrl = `${ShareDocumentURL}${Catelogue}/${code}.pdf`;
    const formatNumber = mobile.replace(/^0/, "94");
    // const formatNumber = "94789251014";

    if (IsShareWhatsAppAPIThrough) {

      try {
        setOpen(false);
        const apiUrl = `https://api.textmebot.com/send.php?recipient=${formatNumber}&apikey=781LrdZkpdLh&document=${documentUrl}&text=${message}`;

        const response = await fetch(apiUrl, {
          method: "GET",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("Document sent successfully!");

      } catch (error) {
        console.log(error);
      }
    } else {
      handleOpenWhatsappTemp(message, documentUrl);
    }
  };


  return (
    <>
      <Tooltip title="Share" placement="top">
        <span>
          <IconButton
            onClick={handleOpen}
            aria-label="edit"
            size="small"
            disabled={loading}
          >
            <WhatsAppIcon color={loading ? "disabled" : "primary"} fontSize="medium" />
            {loading ? "..." : ""}
          </IconButton>
        </span>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Grid container>
            <Grid item xs={12} mt={1}>
              <Typography
                as="h4"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  mb: "12px",
                }}
              >
                Share on WhatsApp
              </Typography>
              <Typography as="h6">
                Are you sure you want to share this on WhatsApp?
              </Typography>
              <ReportPreview url={preview} />
            </Grid>

            <Grid item display="flex" gap={1} xs={12} mt={2}>
              <Button color="error" onClick={handleClose} variant="outlined">
                No
              </Button>
              <Button variant="contained" disabled={!IsGarmentSystem} onClick={handleShareOnWhatsapp}>
                Yes
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

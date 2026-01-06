import BASE_URL from "Base/api";

export const createDocumentWithoutURL = async ({ inquiry, documentType, documentContentType, documentSubContentType }) => {
  const data = {
    InquiryID: inquiry.inquiryId,
    InqCode: inquiry.inquiryCode,
    WindowType: inquiry.windowType,
    OptionId: inquiry.optionId,
    DocumentType: documentType,
    DocumentContentType: documentContentType,
    DocumentSubContentType: documentSubContentType,
  };

  const response = await fetch(`${BASE_URL}/AWS/CreateDocumentWithoutURL`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await response.json();
};

import BASE_URL from "Base/api";

export const uploadFile = async ({
    file,
    inquiry,
    fileName,
    documentType,
    documentContentType,
    documentSubContentType,
    onUploadStart,
    onUploadEnd,
}) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("File", file);
    formData.append("InquiryID", inquiry.inquiryId);
    formData.append("InqCode", inquiry.inquiryCode);
    formData.append("WindowType", inquiry.windowType);
    formData.append("OptionId", inquiry.optionId);
    formData.append("DocumentType", documentType);
    formData.append("DocumentContentType", documentContentType);
    formData.append("DocumentSubContentType", documentSubContentType);
    formData.append("FileName", fileName);

    try {
        onUploadStart?.();
        const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
        });
        return await response.json();
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    } finally {
        onUploadEnd?.();
    }
};

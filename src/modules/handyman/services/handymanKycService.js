import axiosInstance from "../../../core/api/axiosInstance"

export const submitHandymanKycApi = (formData) => {
    return axiosInstance.post("/identity/kyc/handyman/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};
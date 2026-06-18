import axiosInstance from "./axiosInstance";

/**
 * POST /api/auth/register
 * multipart/form-data — required by backend for id_document + selfie_document files.
 *
 * @param {object} fields 
 * @param {File} idDocument
 * @param {File} selfieDocument
 
export async function register(fields, idDocument, selfieDocument) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
  formData.append("id_document", idDocument);
  formData.append("selfie_document", selfieDocument);

  const { data } = await axiosInstance.post("/api/auth/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * POST /api/auth/verify-otp
 * @param {string} email
 * @param {string} otpCode - 6 digits
 * @param {"email_verification"|"password_reset"|"withdrawal_confirm"} purpose
 */
export async function verifyOtp(email, otpCode, purpose = "email_verification") {
  const { data } = await axiosInstance.post("/api/auth/verify-otp", {
    email,
    otp_code: otpCode,
    purpose,
  });
  return data;
}

export async function resendOtp(email, purpose = "email_verification") {
  const { data } = await axiosInstance.post("/api/auth/resend-otp", { email, purpose });
  return data;
}

export async function login(email, password) {
  const { data } = await axiosInstance.post("/api/auth/login", { email, password });

  if (data?.data?.access_token) {
    localStorage.setItem("access_token", data.data.access_token);
    localStorage.setItem("refresh_token", data.data.refresh_token);
    localStorage.setItem("host", JSON.stringify(data.data.host));
  }

  return data;
}

export async function logout() {
  try {
    await axiosInstance.post("/api/auth/logout");
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("host");
  }
}

export async function forgotPassword(email) {
  const { data } = await axiosInstance.post("/api/auth/forgot-password", { email });
  return data;
}


export async function resetPassword(email, otpCode, newPassword, confirmPassword) {
  const { data } = await axiosInstance.post("/api/auth/reset-password", {
    email,
    otp_code: otpCode,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
  return data;
}

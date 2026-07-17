/**
 * سرویس ارتباط با بک‌اند جنگو (API Client)
 * سامانه هوشمند چاپ روشن
 */

const API_BASE_URL = "http://localhost:8000/api";

// ذخیره و بازیابی توکن احراز هویت در مرورگر
export const getToken = (): string | null => localStorage.getItem("chap-roshan-token");
export const setToken = (token: string): void => localStorage.setItem("chap-roshan-token", token);
export const removeToken = (): void => localStorage.removeItem("chap-roshan-token");

// تابع کمکی برای انجام ریکوئست‌های HTTP با هدرهای استاندارد
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  // اضافه کردن توکن به هدر در صورت وجود
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Token ${token}`);
  }

  // ست کردن فرمت پیش‌فرض JSON در صورتی که فایل ارسال نمی‌کنیم
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || `خطای سرور (${response.status})`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export interface UserResponse {
  id: number;
  name: string;
  phone: string;
  email: string;
  registeredAt: string;
}

export interface OTPRequestResponse {
  success: boolean;
  message: string;
  demo_code?: string;
  expires_in_seconds: number;
}

export interface OTPVerifyResponse {
  success: boolean;
  token: string;
  user: UserResponse;
  is_new_user: boolean;
  message: string;
}

export interface BackendOrder {
  id: string;
  product: {
    id: string;
    title: string;
    unit_price: number;
  };
  details: {
    quantity: number;
    material: string;
    size: string;
    printSide: string;
    finishes: string[];
  };
  customer: {
    name: string;
    phone: string;
    note: string;
  };
  fileName: string;
  estimatedPrice: number;
  status: string;
  createdAt: string;
}

export const apiService = {
  /**
   * ۱. ارسال درخواست کد OTP
   */
  async requestOTP(phone: string): Promise<OTPRequestResponse> {
    return request<OTPRequestResponse>("/accounts/otp/request/", {
      method: "POST",
      body: JSON.stringify({ phone_number: phone }),
    });
  },

  /**
   * ۲. تایید کد OTP و دریافت توکن ورود
   */
  async verifyOTP(phone: string, code: string): Promise<OTPVerifyResponse> {
    const res = await request<OTPVerifyResponse>("/accounts/otp/verify/", {
      method: "POST",
      body: JSON.stringify({ phone_number: phone, code }),
    });
    if (res.success && res.token) {
      setToken(res.token);
    }
    return res;
  },

  /**
   * ۳. دریافت اطلاعات پروفایل جاری کاربر
   */
  async getProfile(): Promise<UserResponse> {
    return request<UserResponse>("/accounts/profile/");
  },

  /**
   * ۴. بروزرسانی اطلاعات پروفایل کاربری
   */
  async updateProfile(name: string, email: string): Promise<{ success: boolean; message: string; user: UserResponse }> {
    return request<{ success: boolean; message: string; user: UserResponse }>("/accounts/profile/", {
      method: "PUT",
      body: JSON.stringify({ name, email }),
    });
  },

  /**
   * ۵. دریافت لیست محصولات چاپی
   */
  async getProducts(): Promise<Array<{ id: string; title: string; description: string; unit_price: number }>> {
    return request<Array<{ id: string; title: string; description: string; unit_price: number }>>("/orders/products/");
  },

  /**
   * ۶. برآورد زنده قیمت سفارش در بک‌اند
   */
  async estimatePrice(productId: string, quantity: number, printSide: string, finishes: string[]): Promise<{ estimated_price: number }> {
    return request<{ estimated_price: number }>("/orders/estimate-price/", {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        quantity,
        print_side: printSide,
        finishes,
      }),
    });
  },

  /**
   * ۷. ثبت نهایی سفارش چاپی (ویزارد)
   */
  async submitOrder(orderData: {
    productId: string;
    quantity: number;
    material: string;
    size: string;
    printSide: string;
    finishes: string[];
    customerName: string;
    customerPhone: string;
    customerNote: string;
    fileBlob?: File;
  }): Promise<{ success: boolean; message: string; order: BackendOrder }> {
    const formData = new FormData();
    formData.append("product", orderData.productId);
    formData.append("quantity", orderData.quantity.toString());
    formData.append("material", orderData.material);
    formData.append("size", orderData.size);
    formData.append("print_side", orderData.printSide);
    formData.append("customer_name", orderData.customerName);
    formData.append("customer_phone", orderData.customerPhone);
    formData.append("customer_note", orderData.customerNote);

    orderData.finishes.forEach((finishId) => {
      formData.append("finishes", finishId);
    });

    if (orderData.fileBlob) {
      formData.append("file", orderData.fileBlob);
      formData.append("file_name_display", orderData.fileBlob.name);
    }

    return request<{ success: boolean; message: string; order: BackendOrder }>("/orders/orders/", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * ۸. دریافت کل سفارشات کاربر
   */
  async getOrders(): Promise<BackendOrder[]> {
    return request<BackendOrder[]>("/orders/orders/");
  },

  /**
   * ۹. ثبت درخواست تماس مشاوره سازمانی
   */
  async submitCallback(name: string, org: string, phone: string): Promise<{ id: number; name: string; org: string; phone: string }> {
    return request<{ id: number; name: string; org: string; phone: string }>("/orders/callback/", {
      method: "POST",
      body: JSON.stringify({ name, org, phone }),
    });
  },
};

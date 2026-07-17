# 🎨 راهنمای راه‌اندازی و استفاده از بک‌اند سامانه چاپ روشن (IranZamin-Printing)

این پروژه بخش بک‌اند و دیتابیس اختصاصی برای سامانه ثبت سفارش آنلاین چاپ روشن است که با استفاده از زبان **پایتون (Python)**، فریم‌ورک قدرتمند **جنگو (Django)** و **Django REST Framework (DRF)** طراحی و پیاده‌سازی شده است.

---

## 📋 فهرست مطالب
1. [ویژگی‌های کلیدی بک‌اند](#ویژگیهای-کلیدی-بکاند)
2. [طراحی دیتابیس (Database Schema)](#طراحی-دیتابیس-database-schema)
3. [نصب و راه‌اندازی سریع](#نصب-و-راهاندازی-سریع)
4. [مستندات کلیدهای API (API Endpoints)](#مستندات-کلیدهای-api-api-endpoints)
5. [آموزش اتصال فرانت‌اند (React) به بک‌اند (Django)](#آموزش-اتصال-فرانتاند-react-به-بکاند-django)

---

## ✨ ویژگی‌های کلیدی بک‌اند

- **سیستم ورود اختصاصی OTP (بدون نیاز به رمز عبور):** تولید و تایید کدهای ۶ رقمی یکبار مصرف با انقضای ۳ دقیقه‌ای برای امنیت بالا.
- **جریان ثبت سفارش ویزاردی کامل:** ثبت کامل سفارش شامل انتخاب محصول، تیراژ، جنس، ابعاد، جهت چاپ، خدمات تکمیلی پویا، نام کاربری و شماره تماس.
- **محاسبه مجدد و اعتبارسنجی قیمت در سمت سرور:** جهت جلوگیری از تقلب و مغایرت قیمت‌ها، تمامی قیمت‌ها بر اساس فرمول تجاری چاپ‌خانه در بک‌اند بازمحاسبه و رند می‌شوند.
- **سیستم مدیریت فایل‌های سفارش:** امکان آپلود آسان فایل‌های پی‌دی‌اف و تصاویر مرتبط با سفارش در دایرکتوری‌های تفکیک شده بر اساس کد رهگیری.
- **درخواست‌های مشاوره سازمانی:** ثبت آسان فرم تماس و درخواست‌های همکاران بخش سازمان‌ها.
- **پنل مدیریت جنگو کاملاً فارسی‌سازی شده (RTL):** همراه با خلاصه عملکرد مالی، مجموع درآمدهای کل، وضعیت سفارشات و مدیریت کامل محصولات و خدمات تکمیلی.

---

## 🗄️ طراحی دیتابیس (Database Schema)

دیتا بیس سیستم به صورت رابطه ای (Relational) به شکل زیر طراحی شده است:

### ۱. مدل کاربر (`accounts.User`)
*این مدل از کلاس `AbstractUser` جنگو ارث‌بری می‌کند و شماره موبایل را به عنوان فیلد اصلی احراز هویت قرار می‌دهد.*
- `id` (int, Primary Key)
- `phone_number` (varchar, Unique) - شماره موبایل مشتری (فرمت: `09xxxxxxxx` - شناسه اصلی ورود)
- `full_name` (varchar) - نام و نام خانوادگی مشتری
- `email` (varchar) - ایمیل مشتری
- `is_staff` / `is_superuser` / `is_active` - دسترسی‌های مدیریتی و فعال بودن اکانت
- `date_joined` - تاریخ ثبت نام

### ۲. مدل درخواست‌های کد تایید (`accounts.OTPRequest`)
- `id` (int, Primary Key)
- `phone_number` (varchar) - شماره موبایل درخواست کننده
- `code` (varchar) - کد تایید ۶ رقمی تولید شده
- `created_at` (datetime) - زمان ایجاد درخواست
- `expires_at` (datetime) - زمان انقضا (۳ دقیقه پس از ایجاد)
- `is_used` (boolean) - آیا از این کد استفاده شده است؟

### ۳. مدل محصول (`orders.Product`)
- `id` (varchar, Primary Key) - شناسه یکتای متنی (مثال: `business-card`, `catalog`)
- `title` (varchar) - عنوان فارسی محصول (مثال: کارت ویزیت)
- `description` (text) - توضیحات کوتاه محصول
- `unit_price` (integer) - قیمت پایه محصول به تومان
- `is_active` (boolean) - وضعیت فعال بودن برای نمایش در ویزارد

### ۴. مدل خدمات تکمیلی (`orders.Finish`)
- `id` (varchar, Primary Key) - شناسه متنی خدمت (مثال: `matte`, `uv`, `foil`)
- `label` (varchar) - عنوان خدمت تکمیلی (مثال: روکش مات)
- `factor` (float) - ضریب افزایش قیمت (مثال: `0.12` معادل ۱۲٪ درصد)
- `is_active` (boolean) - وضعیت فعال بودن

### ۵. مدل سفارش (`orders.Order`)
- `tracking_code` (varchar, Unique, PK) - کد رهگیری سفارش با فرمت `CR-XXXXXXX`
- `user` (ForeignKey, Optional) - اتصال به حساب کاربری ثبت‌کننده (در صورت لاگین بودن)
- `product` (ForeignKey) - اتصال به محصول انتخاب شده
- `quantity` (integer) - تیراژ انتخابی
- `material` (varchar) - جنس کاغذ انتخابی
- `size` (varchar) - ابعاد چاپ
- `print_side` (varchar) - چاپ یک‌رو یا دورو رنگی
- `finishes` (ManyToManyField) - لیست خدمات تکمیلی انتخابی برای سفارش
- `file` (FileField) - فایل طرح یا عکس آپلود شده توسط مشتری
- `file_name_display` (varchar) - نام فایل آپلود شده جهت نمایش در پنل
- `customer_name` (varchar) - نام مشتری وارد شده در ویزارد
- `customer_phone` (varchar) - شماره موبایل مشتری
- `customer_note` (text) - توضیحات و یادداشت مشتری برای سفارش
- `estimated_price` (integer) - قیمت برآورد شده دقیق نهایی (محاسبه شده در سمت سرور)
- `status` (varchar) - وضعیت سفارش (`pending`, `processing`, `printing`, `ready`, `shipped`, `cancelled`)
- `created_at` / `updated_at` (datetime) - زمان ثبت و ویرایش سفارش

### ۶. مدل درخواست مشاوره سازمانی (`orders.CallbackRequest`)
- `id` (int, Primary Key)
- `name` (varchar) - نام شخص
- `org` (varchar) - نام سازمان/شرکت
- `phone` (varchar) - شماره تماس
- `status` (varchar) - وضعیت بررسی درخواست (`pending`, `called`, `failed`)
- `created_at` (datetime) - زمان ثبت درخواست

---

## 🚀 نصب و راه‌اندازی سریع

برای نصب و اجرای پروژه جنگو در سیستم محلی خود مراحل زیر را طی کنید:

### ۱. ساخت محیط مجازی و نصب ابزارها
ابتدا وارد پوشه بک‌اند شده و یک محیط مجازی پایتون بسازید و آن را فعال کنید:

```bash
cd backend
python3 -m venv venv

# فعال‌سازی در لینوکس و مک:
source venv/bin/activate

# فعال‌سازی در ویندوز:
venv\Scripts\activate
```

سپس کتابخانه‌های مورد نیاز را نصب کنید:
```bash
pip install -r requirements.txt
```

### ۲. اجرای Migration ها (ساخت دیتابیس)
جداول دیتابیس محلی SQLite را بسازید:
```bash
python manage.py makemigrations accounts orders
python manage.py migrate
```

### ۳. وارد کردن داده‌های پایه فرانت‌اند (Seeding)
دستور سفارشی زیر را برای پر کردن دیتابیس با محصولات و خدمات تکمیلی مطابق با کدهای پروژه فرانت‌اند اجرا کنید:
```bash
python manage.py seed_data
```

### ۴. ساخت کاربر مدیر (Superuser) برای پنل ادمین
یک اکانت مدیر بسازید تا بتوانید وارد پنل مدیریت جنگو شوید:
```bash
python manage.py createsuperuser
```
*(شماره موبایل، نام خانوادگی و یک پسورد مطمئن وارد کنید)*

### ۵. اجرای سرور توسعه جنگو
حالا سرور را استارت بزنید:
```bash
python manage.py runserver
```
سرور شما روی پورت پیش‌فرض `http://127.0.0.1:8000/` آماده به کار است. پنل مدیریت زیبای پروژه در آدرس `http://127.0.0.1:8000/admin/` قابل دسترسی است.

---

## 🛰️ مستندات کلیدهای API (API Endpoints)

بک‌اند شامل اندپوینت‌های استانداردی است که به صورت JSON با متدهای RESTful کار می‌کنند. تمامی پاسخ‌ها با یونیکد استاندارد فارسی هستند.

### ۱. سیستم ورود و ثبت نام OTP

#### 🔹 درخواست ارسال کد تایید یکبار مصرف
- **آدرس:** `POST /api/accounts/otp/request/`
- **ورودی (JSON):**
  ```json
  {
    "phone_number": "09123456789"
  }
  ```
- **خروجی موفق (JSON):**
  ```json
  {
    "success": true,
    "message": "کد تایید ارسال شد.",
    "demo_code": "415926",
    "expires_in_seconds": 180
  }
  ```
  *(نکته: در حالت دمو و توسعه، کد تولید شده در پاسخ `demo_code` برمی‌گردد تا به راحتی تست کنید.)*

#### 🔹 تایید کد OTP و دریافت توکن ورود
- **آدرس:** `POST /api/accounts/otp/verify/`
- **ورودی (JSON):**
  ```json
  {
    "phone_number": "09123456789",
    "code": "415926"
  }
  ```
- **خروجی موفق (JSON):**
  ```json
  {
    "success": true,
    "token": "4a71b9f5e26c6d37f81a5a0...",
    "user": {
      "id": 1,
      "name": "علی حسینی",
      "phone": "09123456789",
      "email": "ali@example.com",
      "registeredAt": "2026-07-17T20:30:00Z"
    },
    "is_new_user": false,
    "message": "ورود با موفقیت انجام شد."
  }
  ```

#### 🔹 دریافت و ویرایش اطلاعات پروفایل کاربری (نیاز به هدر Authorization)
- **آدرس:** `GET` / `PUT` `/api/accounts/profile/`
- **هدر احراز هویت:** `Authorization: Token <your_token_key>`
- **ورودی ویرایش (JSON):**
  ```json
  {
    "name": "علی حسینی تبریزی",
    "email": "new_email@example.com"
  }
  ```

---

### ۲. سیستم ویزارد سفارشات و خدمات

#### 🔹 دریافت لیست محصولات فعال
- **آدرس:** `GET /api/orders/products/`
- **خروجی:** لیست کامل محصولات به همراه قیمت پایه.

#### 🔹 دریافت خدمات تکمیلی چاپ
- **آدرس:** `GET /api/orders/finishes/`
- **خروجی:** لیست خدمات (طلاکوب، روکش مات و ...) همراه با ضریب قیمت هر کدام.

#### 🔹 محاسبه و برآورد زنده قیمت نهایی در سرور
- **آدرس:** `POST /api/orders/estimate-price/`
- **ورودی (JSON):**
  ```json
  {
    "product_id": "business-card",
    "quantity": 1000,
    "print_side": "دو رو رنگی",
    "finishes": ["matte", "foil"]
  }
  ```
- **خروجی:** قیمت محاسبه شده دقیق منطبق بر الگوریتم به تومان.

#### 🔹 ثبت سفارش نهایی (ویزارد مرحله ۴)
- **آدرس:** `POST /api/orders/orders/`
- **توضیح:** این اندپوینت هم به صورت عادی (مهمان) و هم با هدر توکن (مشتری لاگین شده) کار می‌کند. همچنین از آپلود فایل نیز پشتیبانی می‌کند (فرمت `multipart/form-data`).
- **پارامترهای ورودی (Form-Data / JSON):**
  - `product`: "business-card"
  - `finishes`: `["matte", "uv"]` (به صورت آرایه از رشته‌ها)
  - `quantity`: 500
  - `material`: "گلاسه ۳۰۰ گرم"
  - `size`: "استاندارد"
  - `print_side`: "دو رو رنگی"
  - `customer_name`: "مهندس مهدوی"
  - `customer_phone`: "09121111111"
  - `customer_note`: "در صورت امکان چاپ فوری انجام شود."
  - `file`: *[انتخاب فایل تصویر یا PDF طرح]*
  - `file_name_display`: "card_design.pdf"
- **خروجی موفق:**
  ```json
  {
    "success": true,
    "message": "سفارش شما با موفقیت ثبت شد.",
    "order": {
      "id": "CR-4156789",
      "product": { "id": "business-card", "title": "کارت ویزیت", "unit_price": 4200 },
      "details": {
        "quantity": 500,
        "material": "گلاسه ۳۰۰ گرم",
        "size": "استاندارد",
        "printSide": "دو رو رنگی",
        "finishes": ["matte", "uv"]
      },
      "customer": {
        "name": "مهندس مهدوی",
        "phone": "09121111111",
        "note": "در صورت امکان چاپ فوری انجام شود."
      },
      "fileName": "card_design.pdf",
      "estimatedPrice": 3250000,
      "status": "pending",
      "createdAt": "2026-07-17T20:45:00Z"
    }
  }
  ```

#### 🔹 دریافت سفارشات کاربر لاگین شده (نیاز به هدر Authorization)
- **آدرس:** `GET /api/orders/orders/`
- **توضیح:** سفارشاتی که شماره موبایل یا اکانت کاربر با آن‌ها همخوانی دارد را برمی‌گرداند.

#### 🔹 ثبت درخواست مشاوره بخش سازمانی
- **آدرس:** `POST /api/orders/callback/`
- **ورودی (JSON):**
  ```json
  {
    "name": "محسن کریمی",
    "org": "سازمان بنادر ایران",
    "phone": "09129999999"
  }
  ```

---

## 🔌 آموزش اتصال فرانت‌اند (React) به بک‌اند (Django)

در فرانت‌اند پروژه (پوشه `src`) کافیست یک فایل تنظیمات API یا کلاینت Axios بسازید. برای نمونه، تغییرات زیر ارتباط بین React و جنگو را برقرار می‌کنند:

### نمونه تابع ارسال درخواست در فرانت‌اند React:

```typescript
const BASE_URL = "http://localhost:8000/api";

// ۱. ارسال درخواست OTP برای ورود
export async function requestOTP(phone: string) {
  const response = await fetch(`${BASE_URL}/accounts/otp/request/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phone })
  });
  return response.json();
}

// ۲. تایید OTP و ذخیره توکن
export async function verifyOTP(phone: string, code: string) {
  const response = await fetch(`${BASE_URL}/accounts/otp/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phone, code })
  });
  const data = await response.json();
  if (data.success && data.token) {
    localStorage.setItem("chap-roshan-token", data.token);
  }
  return data;
}

// ۳. ثبت نهایی سفارش با فایل طراحی
export async function submitWizardOrder(orderData: any, fileBlob?: File) {
  const formData = new FormData();
  
  // فیلدهای متنی سفارش
  formData.append("product", orderData.productId);
  formData.append("quantity", orderData.quantity.toString());
  formData.append("material", orderData.material);
  formData.append("size", orderData.size);
  formData.append("print_side", orderData.printSide);
  formData.append("customer_name", orderData.customerName);
  formData.append("customer_phone", orderData.customerPhone);
  formData.append("customer_note", orderData.customerNote || "");
  
  // اضافه کردن خدمات تکمیلی
  orderData.finishes.forEach((finishId: string) => {
    formData.append("finishes", finishId);
  });

  if (fileBlob) {
    formData.append("file", fileBlob);
    formData.append("file_name_display", fileBlob.name);
  }

  const token = localStorage.getItem("chap-roshan-token");
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }

  const response = await fetch(`${BASE_URL}/orders/orders/`, {
    method: 'POST',
    headers: headers,
    body: formData
  });
  return response.json();
}
```

این مستندات و معماری تمیز دیتابیس، بستر فوق‌العاده مطمئن و مقیاس‌پذیری برای توسعه‌های آتی و استقرار در سرور تولید (Production) فراهم کرده است.

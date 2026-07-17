import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LogOut,
  Moon,
  Package,
  Printer,
  Sun,
  User,
  X,
  Search,
  MessageSquare,
  Bell,
  HelpCircle,
  CreditCard,
  Download,
  Shield,
  Settings,
  Building,
  MapPin,
  FileText,
  Clock,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Copy,
  Edit2,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type UserProfile } from "../contexts/AuthContext";
import { apiService, type BackendOrder } from "../services/api";

type Theme = "dark" | "light";
type SubTab = 
  | "dashboard" 
  | "orders" 
  | "drafts" 
  | "invoices" 
  | "payments" 
  | "downloads" 
  | "messages" 
  | "notifications" 
  | "support" 
  | "academy" 
  | "blog" 
  | "addresses" 
  | "company" 
  | "profile" 
  | "security" 
  | "settings";

type StoredOrder = {
  id: string;
  product: { id: string; title: string };
  details: {
    quantity: number;
    material: string;
    size: string;
    printSide: string;
    finishes: string[];
  };
  customer: { name: string; phone: string; note: string };
  fileName: string;
  estimatedPrice: number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionId?: string;
  shippingCity?: string;
  shippingAddress?: string;
  postalCode?: string;
  createdAt: string;
};

type AddressItem = {
  id: string;
  title: string;
  address_type: "home" | "office" | "warehouse";
  city: string;
  address: string;
  postal_code: string;
  is_default: boolean;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(value);

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const statusLabels: Record<string, string> = {
  pending: "در انتظار بررسی فایل",
  processing: "در حال طراحی / آماده‌سازی",
  printing: "در حال چاپ در چاپخانه",
  ready: "آماده تحویل / بسته‌بندی شده",
  shipped: "ارسال شده (تحویل پست)",
  cancelled: "لغو شده",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, login, logout, isAuthenticated, isBackendConnected } = useAuth();
  
  // مدیریت تب فعال
  const [activeTab, setActiveTab] = useState<SubTab>("dashboard");
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // فیلترها و مرتب‌سازی سفارشات
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [orderSort, setOrderSort] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // جزئیات سفارش انتخابی (Modal)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<StoredOrder | null>(null);
  
  // دفترچه آدرس‌ها (Address state)
  const [addresses, setAddresses] = useState<AddressItem[]>([
    { id: "1", title: "دفتر مرکزی تهران", address_type: "office", city: "تهران", address: "خیابان مطهری، پلاک ۱۲۰، طبقه سوم", postal_code: "۱۵۸۷۶۵۴۳۲۱", is_default: true },
    { id: "2", title: "انبار تخلیه کاغذ کارگاه", address_type: "warehouse", city: "تهران", address: "جاده مخصوص کرج، کیلومتر ۱۰، کوچه ۱۲", postal_code: "۱۳۹۸۷۶۵۴۳۲", is_default: false },
  ]);
  const [newAddress, setNewAddress] = useState({ title: "", address_type: "office" as any, city: "", address: "", postal_code: "" });

  // اطلاعات شرکت (Company state)
  const [company, setCompany] = useState({
    company_name: "شرکت تبلیغاتی ایده روشن تهران",
    registration_number: "۱۲۳۴۵۶",
    tax_id: "۱۰۱۰۰۹۸۷۶۵۴",
    economic_code: "۴۱۱۱۲۳۴۵۶۷۸۹",
    company_address: "تهران، میدان ونک، برج مروارید، طبقه ۱۲",
  });

  // تیکت‌های پشتیبانی (Support Tickets)
  const [tickets, setTickets] = useState<any[]>([
    { id: "1024", subject: "درخواست ویرایش ابعاد سفارش تراکت", department: "واحد فروش و سفارشات", priority: "متوسط / فنی", status: "answered", created_at: "۱۴۰۵/۰۴/۲۴" },
    { id: "1025", subject: "عدم تایید طرح کارت ویزیت لمینت", department: "آتلیه طراحی و بررسی فایل", priority: "فوری / مالی چاپی", status: "open", created_at: "۱۴۰۵/۰۴/۲۸" }
  ]);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDepartment, setTicketDepartment] = useState("sales");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [ticketMessage, setTicketMessage] = useState("");

  // چت زنده داخل سفارش (Order Live Chat)
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: "designer", text: "سلام علی عزیز، کیفیت طرح کارت ویزیت شما کمی پایینه. آیا فایل PDF و لایه‌باز دارید؟", time: "۱۰:۱۲" },
    { sender: "customer", text: "سلام وقت بخیر، بله فایل PDF با کیفیت ۳۰۰ DPI رو ضمیمه سفارش کردم.", time: "۱۰:۱۵" },
  ]);
  const [chatInput, setChatInput] = useState("");

  // نوتیفیکیشن‌ها (System Notifications)
  const [notifications, setNotifications] = useState<any[]>([
    { id: "n1", type: "order", title: "تغییر وضعیت سفارش کارت ویزیت", desc: "سفارش شما وارد مرحله چاپ در چاپخانه شد.", is_read: false, created_at: "۲ ساعت پیش" },
    { id: "n2", type: "payment", title: "پرداخت موفق تراکت گلاسه", desc: "تراکنش مالی سفارش شما با موفقیت تایید شد.", is_read: true, created_at: "دیروز" },
    { id: "n3", type: "system", title: "کاهش تعرفه‌های تابستانه", desc: "تعرفه‌های چاپ سلفون مات و براق ۱۰٪ ارزان‌تر شد!", is_read: false, created_at: "۲ روز پیش" }
  ]);

  // فاز یازدهم: مدیریت محتوای وبلاگ و سوالات متداول (CMS & FAQ)
  const [blogPosts, setBlogPosts] = useState<any[]>([
    { id: "b1", title: "راهنمای کامل حاشیه امن خط برش", summary: "یاد بگیرید چطور از بریده شدن متون خود در برش جلوگیری کنید...", content: "برای اینکه متون و عناصر مهم طرح شما مثل لوگوها در زمان برش کاغذ چاپخانه از بین نروند، همواره رعایت حاشیه امن ۳ میلی‌متری از هر طرف کاغذ توصیه می‌شود. این فاصله تضمین‌کننده این است که خطاهای فیزیکی دستگاه برش Polar مشکلی ایجاد نکنند.", status: "published", reading_time: 6, view_count: 145, createdAt: "۱۴۰۵/۰۴/۲۴" }
  ]);
  const [activeBlogPost, setActiveBlogPost] = useState<any | null>(null);
  
  const [faqList, setFaqList] = useState<any[]>([
    { id: "f1", question: "حداقل تیراژ کارت ویزیت چقدر است؟", answer: "حداقل تیراژ برای کارهای فرم عمومی ۱۰۰ عدد می‌باشد." },
    { id: "f2", question: "چقدر زمان می‌برد تا سفارش چاپ من آماده شود؟", answer: "زمان تقریبی تحویل برای کارت ویزیت ۳ روز و برای بسته‌بندی ۱۰ روز کاری است." }
  ]);

  // پروفایل و امنیت
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editEmail, setEditEmail] = useState(user?.email ?? "");
  const [editBirthday, setEditBirthday] = useState("۱۳۷۰/۰۶/۱۵");
  const [saved, setSaved] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("chap-roshan-theme") as Theme) ?? "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("chap-roshan-theme", theme);
  }, [theme]);

  // تشخیص تاییدیه نهایی تراکنش بانک پس از بازگشت مشتری (Callback URL listener)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    const refId = params.get("ref_id");

    if (paymentStatus === "success") {
      setToastMessage(`پرداخت موفق! فاکتور تسویه شد. کد پیگیری بانک: ${refId || ""}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === "failed") {
      setToastMessage("تراکنش ناموفق! پرداخت فاکتور توسط کاربر لغو شد یا درگاه ناموفق بود.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // دریافت زنده نوتیفیکیشن‌ها از بک‌اند جنگو
  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      try {
        const response = await fetch("http://localhost:8000/api/notifications/list/", {
          headers: {
            "Authorization": `Token ${localStorage.getItem("chap-roshan-token")}`
          }
        });
        if (response.ok && isMounted) {
          const res = await response.json();
          const mapped = res.map((n: any) => ({
            id: n.id,
            type: n.channel,
            title: n.subject || "اعلان جدید سیستمی",
            desc: n.body,
            is_read: n.is_read,
            created_at: formatDate(n.createdAt)
          }));
          setNotifications(mapped);
        }
      } catch (e) {
        console.warn("Could not fetch notifications dynamically. Using local fallback.");
      }
    }
    if (isAuthenticated) {
      loadNotifications();
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleMarkNotification = async (notificationId: any, action: "read" | "archive" | "delete") => {
    try {
      await fetch("http://localhost:8000/api/notifications/mark/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${localStorage.getItem("chap-roshan-token")}`
        },
        body: JSON.stringify({
          notification_id: notificationId,
          action: action
        })
      });
      setNotifications(prev => {
        if (action === "delete") return prev.filter(n => n.id !== notificationId);
        return prev.map(n => n.id === notificationId ? { 
          ...n, 
          is_read: action === "read" ? true : n.is_read 
        } : n);
      });
    } catch (e) {
      setNotifications(prev => {
        if (action === "delete") return prev.filter(n => n.id !== notificationId);
        return prev.map(n => n.id === notificationId ? { ...n, is_read: action === "read" ? true : n.is_read } : n);
      });
    }
  };

  // دریافت زنده مقالات وبلاگ و سوالات متداول از بک‌اند جنگو
  useEffect(() => {
    let isMounted = true;
    async function loadCMSData() {
      try {
        const blogResponse = await fetch("http://localhost:8000/api/content/posts/");
        if (blogResponse.ok && isMounted) {
          const res = await blogResponse.json();
          const mapped = res.map((p: any) => ({
            id: p.id,
            title: p.title,
            summary: p.summary,
            content: p.content,
            status: p.status,
            reading_time: p.reading_time,
            view_count: p.view_count,
            createdAt: formatDate(p.createdAt)
          }));
          if (mapped.length > 0) setBlogPosts(mapped);
        }
      } catch (e) {
        console.warn("Could not load blog posts from Django. Using local fallback.");
      }

      try {
        const faqResponse = await fetch("http://localhost:8000/api/content/faq/");
        if (faqResponse.ok && isMounted) {
          const res = await faqResponse.json();
          const mapped = res.map((f: any) => ({
            id: f.id,
            question: f.question,
            answer: f.answer
          }));
          if (mapped.length > 0) setFaqList(mapped);
        }
      } catch (e) {
        console.warn("Could not load FAQs from Django. Using local fallback.");
      }
    }

    loadCMSData();

    return () => {
      isMounted = false;
    };
  }, []);

  // بارگذاری زنده سفارشات کاربری
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    
    let isMounted = true;
    
    async function loadOrders() {
      try {
        const backendOrders = await apiService.getOrders();
        if (isMounted) {
          const mappedOrders: StoredOrder[] = backendOrders.map(o => ({
            id: o.id,
            product: { id: o.product.id, title: o.product.title },
            details: {
              quantity: o.details.quantity,
              material: o.details.material,
              size: o.details.size,
              printSide: o.details.printSide,
              finishes: o.details.finishes,
            },
            customer: {
              name: o.customer.name,
              phone: o.customer.phone,
              note: o.customer.note
            },
            fileName: o.fileName,
            estimatedPrice: o.estimatedPrice,
            paymentStatus: o.paymentStatus || "unpaid",
            paymentMethod: o.paymentMethod || "online",
            transactionId: o.transactionId || "",
            shippingCity: o.shippingCity || "",
            shippingAddress: o.shippingAddress || "",
            postalCode: o.postalCode || "",
            status: o.status,
            createdAt: o.createdAt
          }));
          setOrders(mappedOrders);
        }
      } catch (error: any) {
        console.warn("Could not load orders dynamically. Falling back to local storage.", error.message);
        if (isMounted) {
          try {
            const saved = JSON.parse(localStorage.getItem("chap-roshan-orders") ?? "[]") as StoredOrder[];
            if (user) {
              setOrders(saved.filter((o) => o.customer.phone === user.phone));
            }
          } catch {
            setOrders([]);
          }
        }
      }
    }

    loadOrders();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // هندلر سفارش مجدد یک‌کلیکی
  const handleReorder = (order: StoredOrder) => {
    localStorage.setItem("chap-roshan-reorder-specs", JSON.stringify({
      productId: order.product.id,
      details: order.details,
      customer: order.customer,
      fileName: order.fileName
    }));
    setToastMessage("سفارش با موفقیت کپی شد! در حال انتقال به ویزارد چاپ...");
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate("/");
    }, 1500);
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const orderStats = useMemo(() => {
    const total = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + o.estimatedPrice, 0);
    const active = orders.filter(o => o.status !== "cancelled" && o.status !== "shipped").length;
    return { total, totalSpent, active };
  }, [orders]);

  // فیلتر و مرتب‌سازی داینامیک لیست سفارشات
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (orderFilter !== "all" && o.status !== orderFilter) return false;
        if (orderSearch.trim() !== "") {
          const query = orderSearch.toLowerCase();
          return (
            o.id.toLowerCase().includes(query) ||
            o.product.title.toLowerCase().includes(query) ||
            o.createdAt.includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (orderSort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (orderSort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (orderSort === "price") return b.estimatedPrice - a.estimatedPrice;
        return 0;
      });
  }, [orders, orderFilter, orderSearch, orderSort]);

  const saveProfile = async () => {
    if (!user) return;
    try {
      const res = await apiService.updateProfile(editName, editEmail);
      login({
        id: res.user.id,
        name: res.user.name,
        phone: res.user.phone,
        email: res.user.email,
        registeredAt: res.user.registeredAt,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      const updated: UserProfile = { ...user, name: editName, email: editEmail };
      login(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="profile-shell" dir="rtl" style={{ display: "flex", minHeight: "100vh" }}>
      
      {/* ==========================================
          ۱. سایدبار ناوبری پنل مشتری (Sidebar)
          ========================================== */}
      <aside className="profile-sidebar" style={{
        width: "260px",
        background: "var(--surface)",
        borderLeft: "1px solid var(--line)",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        position: "sticky",
        top: "0",
        height: "100vh",
        zIndex: "100"
      }}>
        <div className="nav-brand" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span style={{ fontSize: "18px", fontWeight: "bold", color: "var(--text)" }}>چاپ روشن</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1" }} className="profile-tabs">
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
            <ClipboardList size={16} /> پیشخوان
          </button>
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
            <Printer size={16} /> سفارش‌ها
          </button>
          <button className={activeTab === "invoices" ? "active" : ""} onClick={() => setActiveTab("invoices")}>
            <FileText size={16} /> فاکتورها
          </button>
          <button className={activeTab === "payments" ? "active" : ""} onClick={() => setActiveTab("payments")}>
            <CreditCard size={16} /> تراکنش‌ها
          </button>
          <button className={activeTab === "downloads" ? "active" : ""} onClick={() => setActiveTab("downloads")}>
            <Download size={16} /> دانلود فایل‌ها
          </button>
          <button className={activeTab === "messages" ? "active" : ""} onClick={() => setActiveTab("messages")}>
            <MessageSquare size={16} /> گفتگوها
          </button>
          <button className={activeTab === "notifications" ? "active" : ""} onClick={() => setActiveTab("notifications")}>
            <Bell size={16} /> اعلان‌ها
          </button>
          <button className={activeTab === "support" ? "active" : ""} onClick={() => setActiveTab("support")}>
            <HelpCircle size={16} /> تیکت پشتیبانی
          </button>
          <button className={activeTab === "addresses" ? "active" : ""} onClick={() => setActiveTab("addresses")}>
            <MapPin size={16} /> آدرس‌ها
          </button>
          <button className={activeTab === "company" ? "active" : ""} onClick={() => setActiveTab("company")}>
            <Building size={16} /> حساب حقوقی
          </button>
          <button className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>
            <User size={16} /> مشخصات من
          </button>
          <button className={activeTab === "security" ? "active" : ""} onClick={() => setActiveTab("security")}>
            <Shield size={16} /> امنیت
          </button>
          <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
            <Settings size={16} /> تنظیمات
          </button>
        </nav>

        <button className="settings-logout" onClick={handleLogout} style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px",
          background: "rgba(239, 68, 68, 0.08)",
          color: "#ef4444",
          border: "0",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "13px"
        }}>
          <LogOut size={16} /> خروج از حساب
        </button>
      </aside>

      {/* ==========================================
          ۲. بخش بدنه اصلی هدر و محتوا
          ========================================== */}
      <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
        
        {/* هدر ثابت بالا */}
        <header style={{
          height: "70px",
          borderBottom: "1px solid var(--line)",
          background: "var(--header-bg)",
          backdropFilter: "blur(18px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: "0",
          zIndex: "90"
        }}>
          {/* سمت راست: سرچ مرکزی */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "300px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", right: "12px", color: "var(--color-text-muted)" }} />
            <input type="text" placeholder="جستجوی سفارش، فاکتور، مقاله..." style={{
              width: "100%",
              height: "40px",
              paddingRight: "38px",
              paddingLeft: "12px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              color: "var(--text)",
              outline: "none",
              fontSize: "13px"
            }} />
          </div>

          {/* سمت چپ: نوتیفیکیشن‌ها، پیام‌ها و تم */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="theme-toggle" onClick={() => setActiveTab("notifications")} style={{ position: "relative" }}>
              <Bell size={17} />
              <span style={{ position: "absolute", top: "2px", right: "2px", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%" }} />
            </button>
            <button className="theme-toggle" onClick={() => setActiveTab("messages")}>
              <MessageSquare size={17} />
            </button>

            {/* آواتار */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderRight: "1px solid var(--line)", paddingRight: "12px", marginRight: "6px" }}>
              <div className="profile-avatar" style={{ width: "36px", height: "36px", fontSize: "14px", display: "grid", placeItems: "center", borderRadius: "50%", background: "var(--accent)", color: "var(--accent-ink)", fontWeight: "bold" }}>
                {user?.name.charAt(0) || "?"}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text)" }}>{user?.name || "کاربر گرامی"}</span>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{user?.phone}</span>
              </div>
            </div>
          </div>
        </header>

        {/* محتوای پنل */}
        <main className="profile-main" style={{ padding: "32px", maxWidth: "1200px", width: "100%", marginInline: "auto" }}>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* ==========================================
                  DASHBOARD TAB (پیشخوان اصلی)
                  ========================================== */}
              {activeTab === "dashboard" && (
                <div>
                  {/* Hero greeting */}
                  <div className="profile-greeting" style={{ marginBottom: "28px" }}>
                    <div>
                      <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text)" }}>سلام {user?.name || "مشتری"} عزیز، خوش آمدید.</h1>
                      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>آخرین ورود: امروز - وضعیت اتصال سرور: {isBackendConnected ? "اتصال زنده دیتابیس 🟢" : "حالت آفلاین دمو 🟡"}</p>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="profile-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "20px", borderRadius: "12px", textAlign: "center" }}>
                      <span style={{ fontSize: "24px", fontWeight: "bold", color: "var(--accent)" }}>{formatPrice(orderStats.active)}</span>
                      <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "12px", marginTop: "4px" }}>سفارش فعال</small>
                    </div>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "20px", borderRadius: "12px", textAlign: "center" }}>
                      <span style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text)" }}>{formatPrice(orders.length)}</span>
                      <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "12px", marginTop: "4px" }}>کل سفارش‌ها</small>
                    </div>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "20px", borderRadius: "12px", textAlign: "center" }}>
                      <span style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text)" }}>{formatPrice(orderStats.totalSpent)} <span style={{ fontSize: "12px" }}>تومان</span></span>
                      <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "12px", marginTop: "4px" }}>مجموع پرداخت‌ها</small>
                    </div>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "20px", borderRadius: "12px", textAlign: "center" }}>
                      <span style={{ fontSize: "24px", fontWeight: "bold", color: "var(--accent-strong)" }}>۲</span>
                      <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "12px", marginTop: "4px" }}>پیام ناخوانده</small>
                    </div>
                  </div>

                  {/* بنر پک نمونه رایگان */}
                  <div style={{
                    margin: "24px 0",
                    padding: "20px",
                    background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px"
                  }}>
                    <div style={{ flex: "1 1 300px" }}>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#38bdf8" }}>📬 هنوز کیفیت کاغذها را لمس نکرده‌اید؟</h3>
                      <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>درخواست پک نمونه فیزیکی رایگان (شامل تمام جنس‌ها و روکش‌های لوکس) دهید تا درب منزل ارسال شود.</p>
                    </div>
                    <button 
                      className="primary-button" 
                      style={{ minHeight: "40px", padding: "0 16px", fontSize: "12px", gap: "8px" }}
                      onClick={async () => {
                        if (!user) return;
                        try {
                          const formData = new FormData();
                          formData.append("product", "custom");
                          formData.append("quantity", "1");
                          formData.append("material", "پک نمونه چاپی رایگان");
                          formData.append("size", "استاندارد");
                          formData.append("print_side", "یک رو رنگی");
                          formData.append("customer_name", user.name || "مشتری گرامی");
                          formData.append("customer_phone", user.phone);
                          formData.append("customer_note", "درخواست اتوماتیک پک نمونه فیزیکی رایگان از داخل پنل کاربری");
                          
                          const response = await fetch("http://localhost:8000/api/orders/orders/", {
                            method: "POST",
                            body: formData
                          });
                          
                          if (response.ok) {
                            alert("درخواست شما با موفقیت ثبت شد! به زودی پک نمونه چاپی درب منزل ارسال خواهد شد.");
                            window.location.reload();
                          } else {
                            throw new Error();
                          }
                        } catch (e: any) {
                          alert("درخواست در لوکال استوریج ثبت شد. به زودی ارسال می‌گردد.");
                        }
                      }}
                    >
                      <Package size={14} /> ارسال پک نمونه رایگان
                    </button>
                  </div>

                  {/* بخش دو ستونه سفارشات اخیر و اقدامات سریع */}
                  <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: "24px", marginTop: "24px" }}>
                    
                    {/* ۵ سفارش آخر */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "12px", padding: "24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>سفارش‌های اخیر</h3>
                        <button onClick={() => setActiveTab("orders")} style={{ fontSize: "13px", color: "var(--accent)", background: "none", border: "0", cursor: "pointer" }}>مشاهده همه سفارش‌ها &larr;</button>
                      </div>

                      <div className="orders-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {orders.length === 0 ? (
                          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>هنوز سفارشی ثبت نکرده‌اید.</p>
                        ) : (
                          orders.slice(0, 5).map((order) => (
                            <div className="order-card" key={order.id} style={{ padding: "14px", border: "1px solid var(--line)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <span style={{ fontSize: "14px", fontWeight: "bold" }}>{order.product.title}</span>
                                <span style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block", marginTop: "4px" }}>کد: {order.id} &bull; تیراژ: {order.details.quantity} عدد</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <span className={`status-badge pending`} style={{ fontSize: "11px" }}>{statusLabels[order.status] || statusLabels.pending}</span>
                                <button className="reorder-action-button" onClick={() => setSelectedOrderDetail(order)} style={{ padding: "4px 10px", fontSize: "11px" }}>جزئیات</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* اقدامات سریع */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "12px", padding: "20px" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "bold" }}>اقدامات سریع</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <button className="primary-button" onClick={() => navigate("/")} style={{ width: "100%", minHeight: "44px", fontSize: "13px" }}>ثبت سفارش جدید چاپی</button>
                          <button className="reorder-action-button" onClick={() => setActiveTab("support")} style={{ width: "100%", justifyContent: "center" }}>ارسال تیکت به پشتیبانی</button>
                          <button className="reorder-action-button" onClick={() => setActiveTab("invoices")} style={{ width: "100%", justifyContent: "center" }}>مشاهده فاکتورها</button>
                        </div>
                      </div>

                      {/* لیست نوتیفیکیشن‌ها کوتاه */}
                      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "12px", padding: "20px" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "bold" }}>اعلان‌های اخیر</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {notifications.slice(0, 3).map((n) => (
                            <div key={n.id} style={{ fontSize: "12px", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
                              <span style={{ fontWeight: "bold", color: n.is_read ? "var(--color-text-muted)" : "var(--accent)" }}>{n.title}</span>
                              <p style={{ margin: "4px 0 0 0", color: "var(--color-text-muted)" }}>{n.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ==========================================
                  ORDERS TAB (مدیریت سفارشات با فیلتر و جستجو)
                  ========================================== */}
              {activeTab === "orders" && (
                <div>
                  <div className="step-title">
                    <span>پنل مدیریت</span>
                    <h3>لیست سفارشات چاپی شما</h3>
                    <p>تمام فاکتورها، فایل‌ها و مراحل تولید فیزیکی سفارشات را مدیریت کنید.</p>
                  </div>

                  {/* نوار فیلترهای ووکامرس */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", margin: "20px 0" }}>
                    <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
                      {["all", "pending", "processing", "printing", "ready", "shipped", "cancelled"].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setOrderFilter(filter)}
                          style={{
                            padding: "6px 14px",
                            background: orderFilter === filter ? "var(--accent)" : "rgba(255,255,255,0.04)",
                            color: orderFilter === filter ? "var(--accent-ink)" : "var(--text)",
                            border: "1px solid var(--line)",
                            borderRadius: "30px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "bold",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {filter === "all" ? "همه" : filter === "pending" ? "بررسی فایل" : filter === "processing" ? "طراحی" : filter === "printing" ? "چاپخانه" : filter === "ready" ? "آماده" : filter === "shipped" ? "ارسال شده" : "لغو شده"}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input 
                        type="text" 
                        placeholder="جستجوی سفارش..." 
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        style={{
                          height: "36px",
                          padding: "0 12px",
                          background: "var(--bg)",
                          border: "1px solid var(--line)",
                          borderRadius: "6px",
                          color: "var(--text)",
                          fontSize: "12px"
                        }}
                      />
                      <select 
                        value={orderSort}
                        onChange={(e) => setOrderSort(e.target.value)}
                        style={{
                          height: "36px",
                          padding: "0 10px",
                          background: "var(--bg)",
                          border: "1px solid var(--line)",
                          borderRadius: "6px",
                          color: "var(--text)",
                          fontSize: "12px"
                        }}
                      >
                        <option value="newest">جدیدترین</option>
                        <option value="oldest">قدیمی‌ترین</option>
                        <option value="price">بالاترین قیمت</option>
                      </select>
                    </div>
                  </div>

                  {/* بدنه لیست سفارشات */}
                  <div className="orders-list">
                    {filteredOrders.length === 0 ? (
                      <div className="orders-empty">
                        <Package size={48} />
                        <h3>هیچ سفارشی یافت نشد.</h3>
                        <p>می‌توانید همین حالا اولین سفارش خود را ثبت کنید.</p>
                        <button className="primary-button" onClick={() => navigate("/")}>
                          ثبت سفارش جدید <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                        {filteredOrders.map((order, index) => (
                          <motion.div
                            className="order-card"
                            key={order.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            style={{
                              padding: "24px",
                              background: "var(--surface)",
                              border: "1px solid var(--line)",
                              borderRadius: "12px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "14px"
                            }}
                          >
                            <div className="order-card-header" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                              <div className="order-card-id" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Printer size={18} style={{ color: "var(--accent)" }} />
                                <span style={{ fontSize: "15px", fontWeight: "bold" }}>{order.product.title}</span>
                                <span style={{ fontFamily: "monospace", color: "var(--color-text-muted)", fontSize: "12px" }}>#{order.id}</span>
                              </div>
                              <span className="order-card-date" style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                                <CalendarDays size={13} style={{ display: "inline", marginLeft: "4px" }} />
                                {formatDate(order.createdAt)}
                              </span>
                            </div>

                            <div className="order-card-details" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", padding: "12px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
                              <div>
                                <dt style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>تیراژ</dt>
                                <dd style={{ fontSize: "13px", fontWeight: "bold", margin: "4px 0 0 0" }}>{formatPrice(order.details.quantity)} عدد</dd>
                              </div>
                              <div>
                                <dt style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>جنس متریال</dt>
                                <dd style={{ fontSize: "13px", margin: "4px 0 0 0" }}>{order.details.material}</dd>
                              </div>
                              <div>
                                <dt style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>مبلغ کل فاکتور</dt>
                                <dd style={{ fontSize: "13px", fontWeight: "bold", color: "var(--accent-strong)", margin: "4px 0 0 0" }}>{formatPrice(order.estimatedPrice)} تومان</dd>
                              </div>
                              <div>
                                <dt style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>فایل طرح</dt>
                                <dd style={{ fontSize: "13px", margin: "4px 0 0 0", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{order.fileName || "بدون طرح ارسالی"}</dd>
                              </div>
                            </div>

                            <div className="order-card-status" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span className={`status-badge pending`}>
                                {statusLabels[order.status] || statusLabels.pending}
                              </span>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button className="reorder-action-button" onClick={() => handleReorder(order)} style={{ background: "none", border: "1px solid var(--line)" }}>
                                  <Copy size={13} /> سفارش مجدد
                                </button>
                                <button className="primary-button" onClick={() => setSelectedOrderDetail(order)} style={{ minHeight: "36px", padding: "0 14px", fontSize: "12px" }}>
                                  پیگیری و گفتگو
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==========================================
                  INVOICES TAB (فاکتورهای پرداخت)
                  ========================================== */}
              {activeTab === "invoices" && (
                <div>
                  <div className="step-title">
                    <span>حسابداری چاپخانه</span>
                    <h3>لیست فاکتورها و تسویه حساب‌ها</h3>
                    <p>فاکتورهای رسمی و پیش‌فاکتور سفارشات را دانلود یا پرداخت کنید.</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {orders.map((o) => (
                      <div key={o.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "20px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                          <span style={{ fontSize: "14px", fontWeight: "bold" }}>پیش‌فاکتور سفارش {o.product.title}</span>
                          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>کد فاکتور: {o.id} &bull; تاریخ: {formatDate(o.createdAt)}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--accent)" }}>{formatPrice(o.estimatedPrice)} تومان</span>
                          <span className={`status-badge pending`} style={{ fontSize: "11px" }}>{o.paymentStatus === 'paid' ? "تسویه شده" : "پرداخت نشده"}</span>
                          {o.paymentStatus !== 'paid' ? (
                            <button 
                              className="primary-button" 
                              style={{ minHeight: "36px", padding: "0 12px", fontSize: "11px" }}
                              onClick={async () => {
                                try {
                                  const response = await fetch("http://localhost:8000/api/payments/pay/initiate/", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      "Authorization": `Token ${localStorage.getItem("chap-roshan-token")}`
                                    },
                                    body: JSON.stringify({
                                      invoice_id: o.id.replace("CR-", ""),
                                      gateway: "sandbox"
                                    })
                                  });
                                  const res = await response.json();
                                  if (res.success && res.redirect_url) {
                                    window.location.href = res.redirect_url;
                                  } else {
                                    throw new Error(res.message);
                                  }
                                } catch (e) {
                                  alert("بک‌آند در دسترس نیست. پرداخت موفق شبیه‌سازی شد.");
                                  window.location.href = `http://localhost:5173/profile?payment_status=success&ref_id=REF-${Math.floor(Math.random() * 10000000)}`;
                                }
                              }}
                            >
                              <CreditCard size={13} style={{ marginLeft: "4px" }} /> پرداخت فاکتور
                            </button>
                          ) : (
                            <button className="reorder-action-button" onClick={() => alert("دریافت نسخه چاپی فاکتور به زودی فعال می‌شود.")}>
                              <Download size={14} /> دانلود فاکتور
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==========================================
                  PAYMENTS TAB (تاریخچه تراکنش‌های بانکی)
                  ========================================== */}
              {activeTab === "payments" && (
                <div>
                  <div className="step-title">
                    <span>تسویه حساب</span>
                    <h3>تراکنش‌های موفق و ناموفق درگاه بانکی</h3>
                    <p>فهرست پرداخت‌های آنلاین و کارت‌به‌کارت ثبت‌شده در سیستم.</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {orders.filter(o => o.transactionId).map((o) => (
                      <div key={o.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "16px 20px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong style={{ fontSize: "13px" }}>کد تراکنش بانکی: {o.transactionId}</strong>
                          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>بابت سفارش {o.product.title} &bull; درگاه پرداخت آنلاین شاپرک</p>
                        </div>
                        <div style={{ textDirection: "left", textAlign: "left" }}>
                          <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "14px" }}>{formatPrice(o.estimatedPrice)} تومان</span>
                          <span style={{ display: "block", fontSize: "11px", color: "#10b981", marginTop: "4px" }}>تایید شده توسط بانک 🟢</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==========================================
                  DOWNLOADS TAB (مرکز بارگیری اسناد و طرح‌ها)
                  ========================================== */}
              {activeTab === "downloads" && (
                <div>
                  <div className="step-title">
                    <span>اسناد چاپی</span>
                    <h3>بارگیری نهایی فایل‌ها و طرح‌های تایید شده</h3>
                    <p>دسترسی همیشگی به فایل‌های لایه‌باز و چاپی نهایی سفارشات.</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {orders.map((o) => (
                      <div key={o.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "16px 20px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontWeight: "bold", fontSize: "14px" }}>فایل چاپی {o.product.title}</span>
                          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>نسخه تایید شده نهایی جهت تولید فیزیکی &bull; کد: {o.id}</p>
                        </div>
                        <button className="primary-button" style={{ minHeight: "38px", fontSize: "12px", gap: "8px" }} onClick={() => alert("دریافت فایل لایه‌باز به زودی فعال می‌شود.")}>
                          <Download size={14} /> دانلود طرح نهایی چاپی
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==========================================
                  MESSAGES TAB (صندوق پیام و گفتگو با طراح)
                  ========================================== */}
              {activeTab === "messages" && (
                <div>
                  <div className="step-title">
                    <span>آتلیه طراحی</span>
                    <h3>گفتگوهای زنده و آرشیو صندوق پیام</h3>
                    <p>ارتباط بی‌واسطه با طراحان جهت بررسی، اصلاح و تایید نهایی ابعاد طرح چاپی.</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "20px", height: "500px" }}>
                    {/* سمت راست: لیست پیام‌ها */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "10px", padding: "14px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "13px" }}>گفتگوهای فعال</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                        <div style={{ padding: "10px", background: "rgba(255,255,255,0.04)", borderRight: "3px solid var(--accent)", borderRadius: "4px", cursor: "pointer" }}>
                          <span style={{ fontSize: "12px", fontWeight: "bold" }}>طراح آتلیه (حمید مهدوی)</span>
                          <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>آیا فایل PDF و لایه‌باز دارید؟</p>
                        </div>
                      </div>
                    </div>

                    {/* سمت چپ: باکس گفتگو */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "10px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <div style={{ padding: "14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "10px", height: "10px", background: "#10b981", borderRadius: "50%" }} />
                        <span style={{ fontWeight: "bold", fontSize: "13px" }}>گفتگو روی سفارش #CR-88493</span>
                      </div>

                      {/* متن پیام‌ها */}
                      <div style={{ flex: "1", padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {chatMessages.map((msg, idx) => (
                          <div key={idx} style={{
                            alignSelf: msg.sender === "customer" ? "flex-start" : "flex-end",
                            background: msg.sender === "customer" ? "var(--surface-soft)" : "var(--accent)",
                            color: msg.sender === "customer" ? "var(--text)" : "var(--accent-ink)",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            maxWidth: "80%",
                            fontSize: "12px"
                          }}>
                            {msg.text}
                          </div>
                        ))}
                      </div>

                      {/* فیلد ارسال */}
                      <div style={{ padding: "12px", borderTop: "1px solid var(--line)", display: "flex", gap: "8px" }}>
                        <input 
                          type="text" 
                          placeholder="پیام خود را بنویسید..." 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && chatInput.trim() !== "") {
                              setChatMessages([...chatMessages, { sender: "customer", text: chatInput, time: "۱۰:۱۶" }]);
                              setChatInput("");
                            }
                          }}
                          style={{
                            flex: "1",
                            height: "40px",
                            padding: "0 12px",
                            background: "var(--bg)",
                            border: "1px solid var(--line)",
                            borderRadius: "6px",
                            color: "var(--text)",
                            fontSize: "12px"
                          }}
                        />
                        <button 
                          className="primary-button" 
                          style={{ minHeight: "40px", padding: "0 16px" }}
                          onClick={() => {
                            if (chatInput.trim() !== "") {
                              setChatMessages([...chatMessages, { sender: "customer", text: chatInput, time: "۱۰:۱۶" }]);
                              setChatInput("");
                            }
                          }}
                        >
                          <Send size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  NOTIFICATIONS TAB (اعلان‌های جامع سیستم)
                  ========================================== */}
              {activeTab === "notifications" && (
                <div>
                  <div className="step-title">
                    <span>سامانه اعلانات</span>
                    <h3>اعلان‌ها و پیام‌های دریافتی کارتابل شما</h3>
                    <p>تمام رویدادهای مالی، پشتیبانی و تغییر وضعیت سفارش را در اینجا دنبال کنید.</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {notifications.map((n) => (
                      <div key={n.id} style={{
                        background: n.is_read ? "var(--surface)" : "rgba(56, 189, 248, 0.05)",
                        border: n.is_read ? "1px solid var(--line)" : "1px solid rgba(56, 189, 248, 0.25)",
                        padding: "16px 20px",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <div>
                          <strong style={{ fontSize: "13px", color: n.is_read ? "var(--text)" : "var(--accent)" }}>{n.title}</strong>
                          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>{n.desc}</p>
                          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                            {!n.is_read && (
                              <button onClick={() => handleMarkNotification(n.id, 'read')} style={{ background: "none", border: "0", color: "var(--accent)", fontSize: "11px", cursor: "pointer", padding: 0 }}>خوانده شد</button>
                            )}
                            <button onClick={() => handleMarkNotification(n.id, 'delete')} style={{ background: "none", border: "0", color: "#ef4444", fontSize: "11px", cursor: "pointer", padding: 0 }}>حذف</button>
                          </div>
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{n.created_at}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==========================================
                  SUPPORT TAB (سامانه تیکت‌های پشتیبانی)
                  ========================================== */}
              {activeTab === "support" && (
                <div>
                  <div className="step-title">
                    <span>مرکز پشتیبانی</span>
                    <h3>سیستم ارسال تیکت و ثبت انتقادات</h3>
                    <p>کارشناسان پشتیبانی و مالی ما در کمتر از ۱ ساعت پاسخگوی شما خواهند بود.</p>
                  </div>

                  {/* ایجاد تیکت جدید */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "28px" }}>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "10px", padding: "24px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "16px" }}>ثبت درخواست پشتیبانی جدید</span>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "11px" }}>موضوع تیکت *</span>
                          <input type="text" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="مثلاً عدم تسویه یا ویرایش فایل" style={{
                            height: "40px", padding: "0 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                          }} />
                        </label>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <span style={{ fontSize: "11px" }}>دپارتمان *</span>
                            <select value={ticketDepartment} onChange={(e) => setTicketDepartment(e.target.value)} style={{
                              height: "40px", padding: "0 10px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                            }}>
                              <option value="sales">واحد فروش و سفارشات</option>
                              <option value="design">آتلیه طراحی و فایل</option>
                              <option value="printing">کارگاه چاپ و صحافی</option>
                              <option value="finance">مالی و حسابداری</option>
                            </select>
                          </label>

                          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <span style={{ fontSize: "11px" }}>اولویت *</span>
                            <select value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)} style={{
                              height: "40px", padding: "0 10px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                            }}>
                              <option value="low">کم / عمومی</option>
                              <option value="medium">متوسط / فنی</option>
                              <option value="high">فوری / مالی چاپی</option>
                            </select>
                          </label>
                        </div>

                        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "11px" }}>متن پیام پشتیبانی *</span>
                          <textarea value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} placeholder="شرح درخواست خود را به تفصیل بنویسید..." style={{
                            height: "120px", padding: "12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)", resize: "none"
                          }} />
                        </label>

                        <button className="primary-button" onClick={() => {
                          if (!ticketSubject || !ticketMessage) {
                            alert("لطفاً موضوع و پیام تیکت را پر کنید.");
                            return;
                          }
                          setTickets([...tickets, {
                            id: String(Math.floor(Math.random() * 1000) + 1000),
                            subject: ticketSubject,
                            department: ticketDepartment === 'sales' ? "واحد فروش" : "پشتیبانی فنی",
                            priority: ticketPriority === 'high' ? "فوری" : "متوسط",
                            status: "open",
                            created_at: "امروز"
                          }]);
                          setTicketSubject("");
                          setTicketMessage("");
                          alert("تیکت شما با موفقیت ثبت شد و در صف پاسخگویی کارشناسان قرار گرفت.");
                        }}>ارسال تیکت پشتیبانی</button>
                      </div>
                    </div>

                    {/* تیکت‌های قبلی */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "10px", padding: "24px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "16px" }}>تیکت‌های ارسال شده اخیر</span>

                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {tickets.map((t) => (
                          <div key={t.id} style={{ border: "1px solid var(--line)", padding: "12px", borderRadius: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "13px" }}>#{t.id} - {t.subject}</strong>
                              <span className={`status-badge pending`} style={{ fontSize: "10px" }}>{t.status === 'answered' ? "پاسخ داده شده" : "جدید"}</span>
                            </div>
                            <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>دپارتمان: {t.department} &bull; اولویت: {t.priority}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* بخش سوالات متداول (FAQ Engine) - الگوبرداری از UPrinting */}
                  <div style={{ marginTop: "32px", borderTop: "1px solid var(--line)", paddingTop: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: "var(--text)" }}>❓ سوالات متداول مشتریان (FAQ):</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                      {faqList.map((faq) => (
                        <div key={faq.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "16px", borderRadius: "8px" }}>
                          <strong style={{ fontSize: "13px", color: "var(--accent)" }}>{faq.question}</strong>
                          <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "var(--color-text-muted)", lineHeight: "1.7" }}>{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  ADDRESSES TAB (مدیریت آدرس‌های پستی)
                  ========================================== */}
              {activeTab === "addresses" && (
                <div>
                  <div className="step-title">
                    <span>تحویل و لجستیک</span>
                    <h3>دفترچه آدرس‌های پستی گیرنده</h3>
                    <p>آدرس‌های متعدد منزل، شرکت یا انبار تخلیه را تعریف و مدیریت کنید.</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "28px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {addresses.map((addr) => (
                        <div key={addr.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "20px", borderRadius: "10px", position: "relative" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontWeight: "bold", fontSize: "14px" }}>{addr.title} ({addr.address_type === 'office' ? 'شرکت' : addr.address_type === 'home' ? 'خانه' : 'انبار'})</span>
                            {addr.is_default && <span className="status-badge pending" style={{ background: "#dcfce7", color: "#16a34a", fontSize: "10px" }}>پیش‌فرض ارسال</span>}
                          </div>
                          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>شهر: {addr.city} &bull; آدرس: {addr.address} &bull; کد پستی: {addr.postal_code}</p>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                            <button onClick={() => setAddresses(addresses.filter(a => a.id !== addr.id))} style={{ background: "none", border: "0", color: "#ef4444", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Trash2 size={13} /> حذف</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* فرم آدرس جدید */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "10px", padding: "24px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "16px" }}>افزودن آدرس پستی جدید</span>

                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "11px" }}>عنوان آدرس *</span>
                          <input type="text" value={newAddress.title} onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })} placeholder="مثال: خانه کرج یا کارگاه چاپ" style={{
                            height: "40px", padding: "0 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                          }} />
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <span style={{ fontSize: "11px" }}>شهر *</span>
                            <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="مثال: تهران" style={{
                              height: "40px", padding: "0 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                            }} />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <span style={{ fontSize: "11px" }}>کد پستی ۱۰ رقمی *</span>
                            <input type="text" value={newAddress.postal_code} onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })} placeholder="کد پستی ۱۰ رقمی" style={{
                              height: "40px", padding: "0 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                            }} />
                          </label>
                        </div>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "11px" }}>آدرس پستی دقیق *</span>
                          <textarea value={newAddress.address} onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })} placeholder="آدرس پستی کامل به همراه پلاک و واحد" style={{
                            height: "80px", padding: "12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)", resize: "none"
                          }} />
                        </label>
                        <button className="primary-button" onClick={() => {
                          if (!newAddress.title || !newAddress.city || !newAddress.address) {
                            alert("لطفاً تمام فیلدهای آدرس را پر کنید.");
                            return;
                          }
                          setAddresses([...addresses, {
                            id: String(Date.now()),
                            title: newAddress.title,
                            address_type: newAddress.address_type,
                            city: newAddress.city,
                            address: newAddress.address,
                            postal_code: newAddress.postal_code,
                            is_default: false
                          }]);
                          setNewAddress({ title: "", address_type: "office", city: "", address: "", postal_code: "" });
                        }}>ذخیره آدرس جدید</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  COMPANY TAB (اطلاعات حقوقی شرکت)
                  ========================================== */}
              {activeTab === "company" && (
                <div>
                  <div className="step-title">
                    <span>مشتریان حقوقی</span>
                    <h3>پروفایل ثبتی شرکت و فاکتور رسمی</h3>
                    <p>اطلاعات ثبتی شرکت را تکمیل کنید تا فاکتورها به صورت رسمی صادر شوند.</p>
                  </div>

                  <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "24px", borderRadius: "10px", maxWidth: "600px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span>نام رسمی شرکت / سازمان</span>
                        <input type="text" value={company.company_name} onChange={(e) => setCompany({ ...company, company_name: e.target.value })} style={{
                          height: "40px", padding: "0 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                        }} />
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span>شماره ثبت رسمی</span>
                          <input type="text" value={company.registration_number} onChange={(e) => setCompany({ ...company, registration_number: e.target.value })} style={{
                            height: "40px", padding: "0 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                          }} />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span>شناسه ملی حقوقی</span>
                          <input type="text" value={company.tax_id} onChange={(e) => setCompany({ ...company, tax_id: e.target.value })} style={{
                            height: "40px", padding: "0 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                          }} />
                        </label>
                      </div>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span>کد اقتصادی (ایران)</span>
                        <input type="text" value={company.economic_code} onChange={(e) => setCompany({ ...company, economic_code: e.target.value })} style={{
                          height: "40px", padding: "0 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                        }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span>آدرس قانونی و پستی شرکت</span>
                        <textarea value={company.company_address} onChange={(e) => setCompany({ ...company, company_address: e.target.value })} style={{
                          height: "80px", padding: "12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)", resize: "none"
                        }} />
                      </label>
                      <button className="primary-button" onClick={() => alert("پروفایل حقوقی شرکت با موفقیت به‌روزرسانی شد.")}>ثبت و به‌روزرسانی مشخصات حقوقی</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  PROFILE TAB (اطلاعات پروفایل کاربری)
                  ========================================== */}
              {activeTab === "profile" && (
                <div className="info-panel" style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "24px", borderRadius: "10px" }}>
                  <h3>مشخصات و اطلاعات حساب کاربری</h3>
                  <div className="info-grid">
                    <label>
                      <span>نام و نام خانوادگی</span>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>شماره موبایل</span>
                      <input type="tel" value={user?.phone ?? ""} disabled style={{ opacity: "0.6" }} />
                    </label>
                    <label className="info-full">
                      <span>ایمیل کاربری</span>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="example@mail.com"
                      />
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%" }} className="info-full">
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>تاریخ تولد</span>
                        <input type="text" value={editBirthday} onChange={(e) => setEditBirthday(e.target.value)} placeholder="مثال: ۱۳۷۰/۰۶/۱۵" style={{
                          height: "40px", padding: "0 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                        }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>تاریخ عضویت در پلتفرم</span>
                        <input type="text" value={user?.registeredAt ? formatDate(user.registeredAt) : "—"} disabled style={{
                          height: "40px", padding: "0 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)", opacity: "0.6"
                        }} />
                      </label>
                    </div>
                  </div>
                  <div className="info-actions">
                    <button className="primary-button" onClick={saveProfile}>
                      {saved ? (
                        <>ذخیره شد <Check size={16} /></>
                      ) : (
                        <>ذخیره مشخصات پروفایل <Check size={16} /></>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ==========================================
                  SECURITY TAB (امنیت حساب کاربری)
                  ========================================== */}
              {activeTab === "security" && (
                <div>
                  <div className="step-title">
                    <span>امنیت سایبری</span>
                    <h3>مدیریت رمز عبور و نشست‌های فعال</h3>
                    <p>رمز عبور خود را به صورت دوره‌ای تغییر دهید تا امنیت فایل‌ها و خریدهای شما حفظ شود.</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "28px" }}>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "10px", padding: "24px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "16px" }}>تغییر رمز عبور حساب کاربری</span>

                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "11px" }}>رمز عبور فعلی *</span>
                          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="رمز عبور فعلی خود را وارد کنید" style={{
                            height: "40px", padding: "0 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                          }} />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "11px" }}>رمز عبور جدید *</span>
                          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="رمز عبور جدید (حداقل ۸ کاراکتر)" style={{
                            height: "40px", padding: "0 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)"
                          }} />
                        </label>
                        <button className="primary-button" onClick={() => {
                          if (!oldPassword || !newPassword) {
                            alert("لطفاً رمزهای عبور را پر کنید.");
                            return;
                          }
                          alert("تغییر رمز عبور با موفقیت انجام شد.");
                          setOldPassword("");
                          setNewPassword("");
                        }}>به‌روزرسانی رمز عبور</button>
                      </div>
                    </div>

                    {/* لیست نشست‌های فعال */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "10px", padding: "24px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "16px" }}>نشست‌های فعال شما (Sessions)</span>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: "12px", fontWeight: "bold" }}>مرورگر کروم - ویندوز ۱۰ (فعال فعلی)</span>
                            <small style={{ display: "block", fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>IP: ۱۸۵.۹۰.۱۲.۴ &bull; ایران، تهران</small>
                          </div>
                          <span style={{ color: "#10b981", fontSize: "11px", fontWeight: "bold" }}>آنلاین</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  SETTINGS TAB (تنظیمات عمومی پنل)
                  ========================================== */}
              {activeTab === "settings" && (
                <div className="settings-panel" style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "24px", borderRadius: "10px" }}>
                  <h3>تنظیمات کلی حساب کاربری</h3>

                  <div className="settings-row">
                    <div>
                      <span>نمایش ظاهری</span>
                      <small>تم روشن یا تیره را انتخاب کنید.</small>
                    </div>
                    <div className="settings-theme-toggle">
                      <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}><Moon size={15} /> تیره</button>
                      <button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}><Sun size={15} /> روشن</button>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div>
                      <span>پیگیری خودکار پیامکی</span>
                      <small>هنگام تغییر وضعیت سفارش به خط موبایل شما اس‌ام‌اس ارسال شود.</small>
                    </div>
                    <label className="settings-toggle">
                      <input type="checkbox" defaultChecked />
                      <span />
                    </label>
                  </div>

                  <div className="settings-row" style={{ borderBottom: "0", paddingBottom: "0" }}>
                    <div>
                      <span style={{ color: "#ef4444" }}>حذف دائمی حساب کاربری</span>
                      <small>با حذف حساب، تمام تاریخچه سفارشات و فاکتورهای شما برای همیشه پاک خواهد شد.</small>
                    </div>
                    <button className="primary-button" style={{ background: "#ef4444", color: "#fff", minHeight: "38px", fontSize: "12px" }} onClick={() => {
                      if (confirm("آیا از حذف دائم و غیر قابل بازگشت حساب خود مطمئن هستید؟")) {
                        handleLogout();
                      }
                    }}>حذف حساب</button>
                  </div>
                </div>
              )}

              {/* ==========================================
                  DRAFTS / ACADEMY / BLOG / WALLET TABS (پیش‌فرض‌های آینده‌نگرانه)
                  ========================================== */}
              {activeTab === "drafts" && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "24px", borderRadius: "10px" }}>
                  <h3>سفارش‌های پیش‌نویس (Unfinished Drafts)</h3>
                  <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>لیست سفارشاتی که در مراحل مختلف ویزارد نیمه‌کاره رها شده‌اند.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
                    <div style={{ border: "1px solid var(--line)", padding: "16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "14px" }}>پیش‌نویس کارت ویزیت</strong>
                        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>آخرین ذخیره‌سازی خودکار: ۲ ساعت پیش &bull; گام: مرحله ۳ (راه ارتباطی)</p>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="primary-button" style={{ minHeight: "36px", fontSize: "12px" }} onClick={() => navigate("/")}>ادامه سفارش (Resume)</button>
                        <button className="reorder-action-button" style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.2)" }} onClick={() => alert("پیش‌نویس حذف شد.")}>حذف</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "academy" && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "40px", borderRadius: "12px", textAlign: "center" }}>
                  <BookOpen size={48} style={{ color: "var(--accent)", marginBottom: "16px", marginInline: "auto" }} />
                  <h3 style={{ fontSize: "18px", fontWeight: "bold" }}>آکادمی و دوره‌های آموزشی (Coming Soon)</h3>
                  <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "8px" }}>Professional learning center is under development.</p>
                </div>
              )}

              {activeTab === "blog" && (
                <div>
                  <div className="step-title">
                    <span>وبلاگ تخصصی چاپ</span>
                    <h3>مقالات آموزشی و راهنمای سفارش‌دهی</h3>
                    <p>برترین آموزش‌های طراحی گرافیک، کالیبراسیون خط برش و راهنمای رنگ‌های CMYK.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "10px", overflow: "hidden" }}>
                      <div style={{ height: "140px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }} />
                      <div style={{ padding: "16px" }}>
                        <strong style={{ fontSize: "14px" }}>راهنمای جامع کالیبره کردن رنگ‌های چاپ افست</strong>
                        <p style={{ margin: "8px 0 12px 0", fontSize: "12px", color: "var(--color-text-muted)", lineHeigt: "1.7" }}>یاد بگیرید چگونه کارهای چاپی خود را از خطای تفاوت رنگ مانیتور و خروجی فیزیکی نجات دهید...</p>
                        <button className="text-button" onClick={() => alert("این بخش به زودی به عنوان CMS کامل وبلاگ فعال خواهد شد.")}><ArrowUpLeft size={14} /> مطالعه مقاله</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </main>
      </div>

      {/* ==========================================
          ۳. تودرتوی جزئیات سفارش (Detail Modal)
          ========================================== */}
      <AnimatePresence>
        {selectedOrderDetail && (
          <div className="modal-backdrop" style={{
            position: "fixed",
            inset: "0",
            background: "rgba(0, 0, 0, 0.75)",
            display: "grid",
            placeItems: "center",
            zIndex: "1000",
            backdropFilter: "blur(4px)"
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: "90%",
                maxWidth: "750px",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "14px",
                padding: "24px",
                position: "relative"
              }}
            >
              <button 
                onClick={() => setSelectedOrderDetail(null)} 
                style={{ position: "absolute", left: "20px", top: "20px", background: "none", border: "0", color: "var(--color-text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>

              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "var(--text)" }}>جریان تولید سفارش چاپی</h3>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "-8px", marginBottom: "20px" }}>کد رهگیری انحصاری سفارش: <strong style={{ fontFamily: "monospace", color: "var(--accent)" }}>{selectedOrderDetail.id}</strong></p>

              {/* خط زمانی تولید فیزیکی سفارش (Timeline) - الگوبرداری از ووکامرس */}
              <div style={{
                background: "var(--surface-soft)",
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "24px"
              }}>
                <strong style={{ display: "block", fontSize: "13px", marginBottom: "12px" }}>📍 خط زمانی فرآیند تولید فیزیکی:</strong>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", fontSize: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontWeight: "bold", color: "var(--accent)" }}>۱. ثبت سفارش</span>
                    <small style={{ color: "var(--color-text-muted)" }}>طرح آپلود شد 🟢</small>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontWeight: "bold", color: selectedOrderDetail.paymentStatus === 'paid' ? "var(--accent)" : "var(--color-text-muted)" }}>۲. پرداخت آنلاین</span>
                    <small style={{ color: "var(--color-text-muted)" }}>{selectedOrderDetail.paymentStatus === 'paid' ? "موفق" : "در انتظار پرداخت"}</small>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontWeight: "bold", color: selectedOrderDetail.status !== 'pending' ? "var(--accent)" : "var(--color-text-muted)" }}>۳. لیتوگرافی و چاپ</span>
                    <small style={{ color: "var(--color-text-muted)" }}>{selectedOrderDetail.status === 'printing' ? "در حال چاپ" : "در نوبت"}</small>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontWeight: "bold", color: selectedOrderDetail.status === 'shipped' ? "var(--accent)" : "var(--color-text-muted)" }}>۴. بسته‌بندی و ارسال</span>
                    <small style={{ color: "var(--color-text-muted)" }}>{selectedOrderDetail.status === 'shipped' ? "ارسال شد" : "معلق"}</small>
                  </div>
                </div>
              </div>

              {/* جزئیات فاکتور و آدرس */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "bold" }}>📋 مشخصات فنی چاپ سفارش:</h4>
                  <dl style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "var(--color-text-muted)" }}>محصول:</dt><dd>{selectedOrderDetail.product.title}</dd></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "var(--color-text-muted)" }}>تیراژ:</dt><dd>{formatPrice(selectedOrderDetail.details.quantity)} عدد</dd></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "var(--color-text-muted)" }}>جنس متریال:</dt><dd>{selectedOrderDetail.details.material}</dd></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "var(--color-text-muted)" }}>ابعاد برش:</dt><dd>{selectedOrderDetail.details.size}</dd></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "var(--color-text-muted)" }}>جهت چاپ:</dt><dd>{selectedOrderDetail.details.printSide}</dd></div>
                  </dl>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "bold" }}>📦 آدرس و جزئیات فیزیکی ارسال:</h4>
                  <dl style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "var(--color-text-muted)" }}>شهر مقصد:</dt><dd>{selectedOrderDetail.shippingCity || "تهران (کارگاه مرکزی)"}</dd></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "var(--color-text-muted)" }}>آدرس گیرنده:</dt><dd style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }}>{selectedOrderDetail.shippingAddress || "تحویل حضوری در کارگاه چاپ"}</dd></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "var(--color-text-muted)" }}>کد پستی:</dt><dd>{selectedOrderDetail.postalCode || "—"}</dd></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><dt style={{ color: "var(--color-text-muted)" }}>درگاه تسویه:</dt><dd>{selectedOrderDetail.paymentMethod === 'online' ? "درگاه آنلاین بانکی" : "کارت به کارت"}</dd></div>
                  </dl>
                </div>
              </div>

              {/* فایل‌ها و بارگیری */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "16px", marginTop: "16px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>مبلغ نهایی فاکتور سفارش چاپی</span>
                  <strong style={{ display: "block", fontSize: "18px", color: "var(--accent)" }}>{formatPrice(selectedOrderDetail.estimatedPrice)} تومان</strong>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="reorder-action-button" onClick={() => alert("فایل اصلی طراحی در حال مینیفای بر روی سرور است.")}>
                    <Download size={14} /> بارگیری طرح اصلی
                  </button>
                  <button className="primary-button" style={{ minHeight: "38px", fontSize: "12px" }} onClick={() => {
                    setSelectedOrderDetail(null);
                    setActiveTab("messages");
                  }}>
                    <MessageSquare size={14} /> چت با طراح آتلیه
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          ۴. مودال جزئیات مقاله وبلاگ چاپی (Blog Article Modal)
          ========================================== */}
      <AppModal 
        isOpen={activeBlogPost !== null} 
        onClose={() => setActiveBlogPost(null)} 
        size="lg"
        title="📖 وبلاگ تخصصی چاپ روشن"
      >
        {activeBlogPost && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "16px" }}>
              <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "bold" }}>موضوع مقاله چاپی</span>
              <h2 style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "bold", color: "var(--text)" }}>{activeBlogPost.title}</h2>
              <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--color-text-muted)", marginTop: "8px" }}>
                <span>👁️ {activeBlogPost.view_count} بازدید کل</span>
                <span>&bull;</span>
                <span>⏱️ {activeBlogPost.reading_time} دقیقه زمان مطالعه</span>
                <span>&bull;</span>
                <span>📅 انتشار: {activeBlogPost.createdAt}</span>
              </div>
            </div>

            <div style={{ height: "200px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "8px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: "0", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.06)", fontWeight: "bold", fontSize: "48px" }}>
                CHAP ROSHAN
              </div>
            </div>

            <div style={{ fontSize: "14px", lineHeight: "2.1", color: "var(--text)", textDirection: "right", textAlign: "right" }}>
              <p style={{ fontWeight: "bold", color: "#38bdf8", marginBottom: "12px" }}>{activeBlogPost.summary}</p>
              <div dangerouslySetInnerHTML={{ __html: activeBlogPost.content }} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", borderTop: "1px solid var(--line)", paddingTop: "16px", marginTop: "16px" }}>
              <AppButton variant="outline" onClick={() => setActiveBlogPost(null)}>بستن مقاله</AppButton>
              <AppButton variant="primary" onClick={() => alert("درخواست چاپ کاتالوگ یا مشاوره پیرامون این مقاله")}>مشاوره چاپی پیرامون مقاله</AppButton>
            </div>
          </div>
        )}
      </AppModal>

      {/* اعلان Toast موفقیت */}
      {showToast && (
        <div className="reorder-success-toast">
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

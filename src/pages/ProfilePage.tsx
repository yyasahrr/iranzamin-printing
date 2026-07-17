import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ClipboardList,
  LogOut,
  Moon,
  Package,
  Printer,
  Sun,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type UserProfile } from "../contexts/AuthContext";

type Theme = "dark" | "light";
type Tab = "orders" | "info" | "settings";

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
  createdAt: string;
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
  pending: "در انتظار بررسی",
  approved: "تأیید شده",
  printing: "در حال چاپ",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, login, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("chap-roshan-theme") as Theme) ?? "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("chap-roshan-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem("chap-roshan-orders") ?? "[]") as StoredOrder[];
      if (user) {
        setOrders(saved.filter((o) => o.customer.phone === user.phone));
      }
    } catch {
      setOrders([]);
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const orderStats = useMemo(() => {
    const total = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + o.estimatedPrice, 0);
    return { total, totalSpent };
  }, [orders]);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editEmail, setEditEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState(false);

  const saveProfile = () => {
    if (!user) return;
    const updated: UserProfile = { ...user, name: editName, email: editEmail };
    // Persist + update auth state through the context (no full-page reload).
    login(updated);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="profile-shell" dir="rtl">
      <header className={`profile-header ${scrolled ? "profile-header-scrolled" : ""}`}>
        <div className="profile-header-inner">
          <button className="profile-back" onClick={() => navigate("/")} aria-label="بازگشت به صفحه اصلی">
            <ChevronLeft size={20} />
          </button>
          <span className="profile-header-brand">پنل کاربری</span>

          <div className="profile-header-actions">
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "فعال کردن تم روشن" : "فعال کردن تم تیره"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -20 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 20 }}
                >
                  {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                </motion.span>
              </AnimatePresence>
            </button>
            <button className="menu-toggle" onClick={() => setMenuOpen((o) => !o)} aria-label="منو">
              {menuOpen ? <X size={18} /> : <User size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="profile-dropdown"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <button onClick={() => { setActiveTab("info"); setMenuOpen(false); }}>
                <User size={15} /> ویرایش اطلاعات
              </button>
              <button onClick={() => { setActiveTab("settings"); setMenuOpen(false); }}>
                <Moon size={15} /> تنظیمات
              </button>
              <button className="dropdown-danger" onClick={handleLogout}>
                <LogOut size={15} /> خروج از حساب
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="profile-main">
        <div className="profile-greeting">
          <div className="profile-avatar">
            {user?.name.charAt(0) ?? "?"}
          </div>
          <div>
            <h1>{user?.name ?? "کاربر"} عزیز، خوش آمدید.</h1>
            <p>{user?.phone}</p>
          </div>
        </div>

        <div className="profile-stats">
          <div>
            <span>{formatPrice(orderStats.total)}</span>
            <small>تعداد سفارش‌ها</small>
          </div>
          <div>
            <span>{formatPrice(orderStats.totalSpent)}</span>
            <small>مجموع هزینه</small>
          </div>
        </div>

        <nav className="profile-tabs">
          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            <ClipboardList size={16} />
            سفارش‌ها
          </button>
          <button
            className={activeTab === "info" ? "active" : ""}
            onClick={() => setActiveTab("info")}
          >
            <User size={16} />
            اطلاعات
          </button>
          <button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            <Package size={16} />
            تنظیمات
          </button>
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            className="profile-panel"
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            {activeTab === "orders" && (
              <div className="orders-list">
                {orders.length === 0 ? (
                  <div className="orders-empty">
                    <Package size={48} />
                    <h3>هنوز سفارشی ثبت نکرده‌اید.</h3>
                    <p>اولین سفارش خود را از طریق ویزارد ثبت کنید.</p>
                    <button className="primary-button" onClick={() => navigate("/")}>
                      ثبت سفارش
                      <ArrowLeft size={17} />
                    </button>
                  </div>
                ) : (
                  orders.map((order, index) => (
                    <motion.div
                      className="order-card"
                      key={order.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="order-card-header">
                        <div className="order-card-id">
                          <Printer size={18} />
                          <span>{order.product.title}</span>
                        </div>
                        <span className="order-card-date">
                          <CalendarDays size={14} />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="order-card-details">
                        <div>
                          <dt>کد سفارش</dt>
                          <dd>{order.id}</dd>
                        </div>
                        <div>
                          <dt>تیراژ</dt>
                          <dd>{formatPrice(order.details.quantity)} عدد</dd>
                        </div>
                        <div>
                          <dt>مبلغ</dt>
                          <dd>{formatPrice(order.estimatedPrice)} تومان</dd>
                        </div>
                        <div>
                          <dt>فایل</dt>
                          <dd>{order.fileName || "—"}</dd>
                        </div>
                      </div>
                      <div className="order-card-status">
                        <span className="status-badge pending">
                          {statusLabels.pending}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === "info" && (
              <div className="info-panel">
                <h3>اطلاعات شخصی</h3>
                <div className="info-grid">
                  <label>
                    <span>نام و نام خانوادگی</span>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={!editing}
                    />
                  </label>
                  <label>
                    <span>شماره موبایل</span>
                    <input type="tel" value={user?.phone ?? ""} disabled />
                  </label>
                  <label className="info-full">
                    <span>ایمیل</span>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      disabled={!editing}
                      placeholder="example@mail.com"
                    />
                  </label>
                  <label className="info-full">
                    <span>تاریخ عضویت</span>
                    <input
                      type="text"
                      value={user?.registeredAt ? formatDate(user.registeredAt) : "—"}
                      disabled
                    />
                  </label>
                </div>
                <div className="info-actions">
                  {editing ? (
                    <>
                      <button className="primary-button" onClick={saveProfile}>
                        {saved ? (
                          <>ذخیره شد <Check size={16} /></>
                        ) : (
                          <>ذخیره تغییرات <Check size={16} /></>
                        )}
                      </button>
                      <button
                        className="back-button"
                        onClick={() => { setEditing(false); setEditName(user?.name ?? ""); setEditEmail(user?.email ?? ""); }}
                      >
                        انصراف
                      </button>
                    </>
                  ) : (
                    <button className="primary-button" onClick={() => setEditing(true)}>
                      ویرایش اطلاعات
                      <User size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="settings-panel">
                <h3>تنظیمات حساب</h3>

                <div className="settings-row">
                  <div>
                    <span>نمایش ظاهری</span>
                    <small>تم روشن یا تیره را انتخاب کنید.</small>
                  </div>
                  <div className="settings-theme-toggle">
                    <button
                      className={theme === "dark" ? "active" : ""}
                      onClick={() => setTheme("dark")}
                    >
                      <Moon size={15} />
                      تیره
                    </button>
                    <button
                      className={theme === "light" ? "active" : ""}
                      onClick={() => setTheme("light")}
                    >
                      <Sun size={15} />
                      روشن
                    </button>
                  </div>
                </div>

                <div className="settings-row">
                  <div>
                    <span>پیگیری خودکار</span>
                    <small>هنگام تغییر وضعیت سفارش به شما پیامک می‌شود.</small>
                  </div>
                  <label className="settings-toggle">
                    <input type="checkbox" defaultChecked />
                    <span />
                  </label>
                </div>

                <div className="settings-row">
                  <div>
                    <span>خروج از حساب</span>
                    <small>برای خروج از پنل کاربری خود کلیک کنید.</small>
                  </div>
                  <button className="settings-logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    خروج
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="profile-footer">
        <div className="profile-footer-inner">
          <a href="/" className="profile-footer-link">
            <ArrowUpLeft size={15} />
            بازگشت به سایت
          </a>
          <p>چاپ روشن &bull; پنل کاربری</p>
        </div>
      </footer>
    </div>
  );
}

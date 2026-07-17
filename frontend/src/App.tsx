import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpLeft,
  AtSign,
  BookOpen,
  Building2,
  Check,
  ChevronLeft,
  CreditCard,
  FileImage,
  FileSignature,
  Handshake,
  Image as ImageIcon,
  Landmark,
  Layers3,
  LogIn,
  Megaphone,
  Menu,
  Moon,
  Package,
  Phone,
  PhoneCall,
  Printer,
  ShoppingBag,
  Sticker,
  Sun,
  UploadCloud,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { apiService } from "./services/api";
import { portfolioData } from "./data/portfolio";
import ProductStep from "./components/wizard/ProductStep";
import DetailsStep from "./components/wizard/DetailsStep";
import ContactStep from "./components/wizard/ContactStep";
import ReviewStep from "./components/wizard/ReviewStep";
import { calculateEstimatedPrice } from "./utils/pricing";

type Theme = "dark" | "light";

type Product = {
  id: string;
  title: string;
  description: string;
  unitPrice: number;
  icon: LucideIcon;
};

type OrderDetails = {
  quantity: number;
  material: string;
  size: string;
  printSide: string;
  finishes: string[];
};

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "business-card",
    title: "کارت ویزیت",
    description: "افست، دیجیتال و کارت‌های خاص",
    unitPrice: 4200,
    icon: CreditCard,
  },
  {
    id: "catalog",
    title: "کاتالوگ و بروشور",
    description: "چاپ دقیق با صحافی حرفه‌ای",
    unitPrice: 16800,
    icon: BookOpen,
  },
  {
    id: "packaging",
    title: "بسته‌بندی",
    description: "جعبه، لیبل و بسته‌بندی اختصاصی",
    unitPrice: 34500,
    icon: Package,
  },
  {
    id: "sticker",
    title: "لیبل و استیکر",
    description: "ضدآب، شفاف و برش اختصاصی",
    unitPrice: 5800,
    icon: Sticker,
  },
  {
    id: "poster",
    title: "پوستر و تراکت",
    description: "تیراژ کم تا چاپ افست انبوه",
    unitPrice: 7600,
    icon: ImageIcon,
  },
  {
    id: "custom",
    title: "سفارش اختصاصی",
    description: "برای ایده‌هایی که قالب آماده ندارند",
    unitPrice: 12000,
    icon: Layers3,
  },
];

const DEFAULT_FINISHES = [
  { id: "matte", label: "روکش مات", factor: 0.12 },
  { id: "uv", label: "یووی موضعی", factor: 0.2 },
  { id: "foil", label: "طلاکوب", factor: 0.28 },
  { id: "emboss", label: "برجسته‌سازی", factor: 0.24 },
];

const DEFAULT_PORTFOLIO = portfolioData;

const serviceRows = [
  {
    number: "۰۱",
    title: "پیش از چاپ",
    text: "بررسی فایل، اصلاح رنگ و آماده‌سازی دقیق برای جلوگیری از خطاهای پرهزینه.",
  },
  {
    number: "۰۲",
    title: "چاپ دیجیتال و افست",
    text: "انتخاب روش چاپ متناسب با تیراژ، زمان و بودجه، بدون افت کیفیت.",
  },
  {
    number: "۰۳",
    title: "خدمات تکمیلی",
    text: "طلاکوب، یووی، برجسته‌سازی، برش خاص، سلفون و انواع صحافی.",
  },
  {
    number: "۰۴",
    title: "بسته‌بندی و ارسال",
    text: "کنترل نهایی، بسته‌بندی ایمن و ارسال سفارش به سراسر ایران.",
  },
];

const wizardSteps = ["انتخاب محصول", "مشخصات چاپ", "فایل و تماس", "بازبینی"];

const orgServices: { icon: LucideIcon; label: string; desc: string }[] = [
  { icon: Landmark, label: "اوراق اداری", desc: "سربرگ، فاکتور، نامه و مکاتبات رسمی" },
  { icon: Megaphone, label: "تبلیغات شهری", desc: "بنر، بیلبورد، استند و فضای تبلیغاتی" },
  { icon: Building2, label: "مناقصات", desc: "پاکت‌های مناقصه و اسناد تدارکاتی" },
  { icon: Package, label: "هدایای سازمانی", desc: "بسته‌بندی اختصاصی و ست‌های تبلیغاتی" },
  { icon: BookOpen, label: "نشریات دوره‌ای", desc: "بولتن، گزارش سالانه و کتابچه" },
  { icon: FileSignature, label: "اسناد امنیتی", desc: "کارت شناسایی، گواهینامه و هولوگرام" },
];

const orgSteps: { num: string; icon: LucideIcon; title: string; text: string }[] = [
  {
    num: "۰۱",
    icon: PhoneCall,
    title: "تماس و نیازسنجی",
    text: "حجم و هدف پروژه ثبت و کارشناس اختصاصی معرفی می‌شود.",
  },
  {
    num: "۰۲",
    icon: Users,
    title: "جلسه حضوری",
    text: "مشاوره تخصصی، نمونه متریال و برآورد اولیه ارائه می‌شود.",
  },
  {
    num: "۰۳",
    icon: FileSignature,
    title: "قرارداد رسمی",
    text: "پیش‌فاکتور شفاف، زمان‌بندی قطعی و امضای قرارداد.",
  },
  {
    num: "۰۴",
    icon: Printer,
    title: "اجرا و تحویل",
    text: "تولید نظارت‌شده و تحویل سندمحور در موعد مقرر.",
  },
];

const orgStats: { value: string; label: string }[] = [
  { value: "+۲۰۰", label: "پروژه سازمانی" },
  { value: "۱۵+", label: "سال تجربه" },
  { value: "۹۸٪", label: "رضایت مشتریان" },
  { value: "۲۴ساعت", label: "پاسخ‌گویی اولیه" },
];

const partners: { name: string; mark: "circle" | "square" | "diamond" | "triangle" | "ring" | "half"; word: "bold" | "wide" | "light" }[] = [
  { name: "آبان تجارت", mark: "circle", word: "bold" },
  { name: "رایکا", mark: "diamond", word: "wide" },
  { name: "داتیس نوین", mark: "square", word: "light" },
  { name: "کندو", mark: "ring", word: "bold" },
  { name: "سپهر گستر", mark: "triangle", word: "light" },
  { name: "نیک‌پوش", mark: "half", word: "wide" },
  { name: "تابش", mark: "diamond", word: "bold" },
  { name: "پارس داده", mark: "circle", word: "light" },
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(value);

function App() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("chap-roshan-theme") as Theme | null;
    return saved ?? "dark";
  });
  const [productsList, setProductsList] = useState(DEFAULT_PRODUCTS);
  const [finishesList, setFinishesList] = useState(DEFAULT_FINISHES);
  const [portfolioList, setPortfolioList] = useState(DEFAULT_PORTFOLIO);

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(DEFAULT_PRODUCTS[0].id);
  const [details, setDetails] = useState<OrderDetails>({
    quantity: 500,
    material: "گلاسه ۳۰۰ گرم",
    size: "استاندارد",
    printSide: "دو رو رنگی",
    finishes: [],
  });
  const [customer, setCustomer] = useState({ name: "", phone: "", note: "" });
  const [fileName, setFileName] = useState("");
  const [fileBlob, setFileBlob] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [orgForm, setOrgForm] = useState({ name: "", org: "", phone: "" });
  const [orgError, setOrgError] = useState("");
  const [orgSubmitted, setOrgSubmitted] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("chap-roshan-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // بررسی درخواست سفارش مجدد یک‌کلیکی (الگوبرداری از VistaPrint/Staples)
  useEffect(() => {
    try {
      const savedSpecs = localStorage.getItem("chap-roshan-reorder-specs");
      if (savedSpecs) {
        const specs = JSON.parse(savedSpecs);
        setSelectedProduct(specs.productId);
        setDetails(specs.details);
        setCustomer(specs.customer);
        setFileName(specs.fileName);
        setWizardStep(3); // ارجاع مستقیم به مرحله بازبینی نهایی
        localStorage.removeItem("chap-roshan-reorder-specs"); // پاک کردن کش سفارش مجدد
      }
    } catch (e) {
      console.error("Could not parse reorder specs", e);
    }
  }, []);

  // بارگذاری داینامیک تعرفه‌ها، محصولات و نمونه کارها از بک‌اند جنگو
  useEffect(() => {
    let isMounted = true;
    async function fetchDynamicData() {
      try {
        const backendProducts = await apiService.getProducts();
        if (isMounted) {
          const mappedProducts = backendProducts.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            unitPrice: p.unit_price,
            icon: DEFAULT_PRODUCTS.find(dp => dp.id === p.id)?.icon || DEFAULT_PRODUCTS[0].icon
          }));
          setProductsList(mappedProducts);
        }
      } catch (error) {
        console.warn("Could not fetch products dynamically from Django. Using defaults.");
      }

      try {
        const backendFinishes = await apiService.getFinishes();
        if (isMounted) {
          const mappedFinishes = backendFinishes.map(f => ({
            id: f.id,
            label: f.label,
            factor: f.factor
          }));
          setFinishesList(mappedFinishes);
        }
      } catch (error) {
        console.warn("Could not fetch finishes dynamically from Django. Using defaults.");
      }

      try {
        const res = await fetch("http://localhost:8000/api/orders/portfolio/");
        if (res.ok) {
          const backendPortfolio = await res.json();
          if (isMounted) {
            const mappedPortfolio = backendPortfolio.map((p: any) => {
              const defaultMatch = DEFAULT_PORTFOLIO.find(dp => dp.slug === p.slug);
              return {
                slug: p.slug,
                title: p.title,
                category: p.category,
                image: p.cover_image || defaultMatch?.image || "/images/work-cafe.jpg",
                gallery: defaultMatch?.gallery || [p.cover_image || "/images/work-cafe.jpg"],
                client: p.client,
                year: defaultMatch?.year || "۱۴۰۴",
                description: p.description || defaultMatch?.description || "",
                fullDescription: p.description || defaultMatch?.fullDescription || "",
                specs: defaultMatch?.specs || [],
                services: defaultMatch?.services || [],
                testimonial: defaultMatch?.testimonial || undefined
              };
            });
            setPortfolioList(mappedPortfolio);
          }
        }
      } catch (error) {
        console.warn("Could not fetch portfolio dynamically from Django. Using defaults.");
      }
    }

    fetchDynamicData();
    return () => {
      isMounted = false;
    };
  }, []);

  const product = productsList.find((item) => item.id === selectedProduct) ?? productsList[0];

  const estimatedPrice = useMemo(() => {
    return calculateEstimatedPrice(
      product.unitPrice,
      details.quantity,
      details.printSide,
      details.finishes,
      finishesList
    );
  }, [details.finishes, details.printSide, details.quantity, product.unitPrice, finishesList]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const toggleFinish = (id: string) => {
    setDetails((current) => ({
      ...current,
      finishes: current.finishes.includes(id)
        ? current.finishes.filter((item) => item !== id)
        : [...current.finishes, id],
    }));
  };

  const goNext = () => {
    setFormError("");
    if (wizardStep === 2) {
      if (!customer.name.trim() || !/^09\d{9}$/.test(customer.phone)) {
        setFormError("نام و شماره موبایل معتبر را وارد کنید.");
        return;
      }
    }
    setWizardStep((step) => Math.min(3, step + 1));
  };

  const restartOrder = () => {
    setWizardStep(0);
    setOrderSubmitted(false);
    setCustomer({ name: "", phone: "", note: "" });
    setFileName("");
    setFileBlob(null);
    setDetails({
      quantity: 500,
      material: "گلاسه ۳۰۰ گرم",
      size: "استاندارد",
      printSide: "دو رو رنگی",
      finishes: [],
    });
  };

  const submitOrder = async () => {
    try {
      const res = await apiService.submitOrder({
        productId: product.id,
        quantity: details.quantity,
        material: details.material,
        size: details.size,
        printSide: details.printSide,
        finishes: details.finishes,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerNote: customer.note,
        fileBlob: fileBlob || undefined,
      });

      if (res.success && res.order) {
        try {
          const localOrder = {
            id: res.order.id,
            product: { id: res.order.product.id, title: res.order.product.title },
            details: res.order.details,
            customer: res.order.customer,
            fileName: res.order.fileName,
            estimatedPrice: res.order.estimatedPrice,
            createdAt: res.order.createdAt,
          };
          const previousOrders = JSON.parse(localStorage.getItem("chap-roshan-orders") ?? "[]");
          localStorage.setItem("chap-roshan-orders", JSON.stringify([...previousOrders, localOrder]));
        } catch {}

        window.dispatchEvent(new CustomEvent("chap-roshan:order-created", { detail: res.order }));
        const numericPart = res.order.id.replace("CR-", "");
        setTrackingCode(new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(Number(numericPart)));
        setOrderSubmitted(true);
      }
    } catch (error: any) {
      console.warn("Django order submission failed. Falling back to offline local storage.", error.message);
      
      const orderId = `CR-${Date.now().toString().slice(-7)}`;
      const fallbackOrder = {
        id: orderId,
        product: { id: product.id, title: product.title },
        details,
        customer,
        fileName,
        estimatedPrice,
        createdAt: new Date().toISOString(),
      };

      try {
        const previousOrders = JSON.parse(localStorage.getItem("chap-roshan-orders") ?? "[]");
        localStorage.setItem("chap-roshan-orders", JSON.stringify([...previousOrders, fallbackOrder]));
      } catch {}

      window.dispatchEvent(new CustomEvent("chap-roshan:order-created", { detail: fallbackOrder }));
      setTrackingCode(new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(Number(orderId.slice(3))));
      setOrderSubmitted(true);
    }
  };

  const submitOrgRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setOrgError("");
    if (!orgForm.name.trim() || !orgForm.org.trim()) {
      setOrgError("نام و نام سازمان را وارد کنید.");
      return;
    }
    if (!/^09\d{9}$/.test(orgForm.phone)) {
      setOrgError("شماره تماس معتبر موبایل (همانند 09123456789) وارد کنید.");
      return;
    }
    
    try {
      await apiService.submitCallback(orgForm.name, orgForm.org, orgForm.phone);
      
      try {
        const request = { ...orgForm, createdAt: new Date().toISOString() };
        const previous = JSON.parse(localStorage.getItem("chap-roshan-callbacks") ?? "[]");
        localStorage.setItem("chap-roshan-callbacks", JSON.stringify([...previous, request]));
      } catch {}

      window.dispatchEvent(new CustomEvent("chap-roshan:callback-requested", { detail: orgForm }));
      setOrgSubmitted(true);
    } catch (error: any) {
      console.warn("Django callback submission failed. Falling back to local storage.", error.message);
      
      const request = { ...orgForm, createdAt: new Date().toISOString() };
      try {
        const previous = JSON.parse(localStorage.getItem("chap-roshan-callbacks") ?? "[]");
        localStorage.setItem("chap-roshan-callbacks", JSON.stringify([...previous, request]));
      } catch {}
      
      window.dispatchEvent(new CustomEvent("chap-roshan:callback-requested", { detail: request }));
      setOrgSubmitted(true);
    }
  };

  const resetOrgRequest = () => {
    setOrgForm({ name: "", org: "", phone: "" });
    setOrgError("");
    setOrgSubmitted(false);
  };

  const reveal = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.7, ease: "easeOut" as const },
  };

  return (
    <div className="app-shell" dir="rtl">
      <header className={`site-header ${scrolled ? "header-scrolled" : ""}`}>
        <a className="nav-brand" href="#top" aria-label="چاپ روشن، صفحه اصلی">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>چاپ روشن</span>
        </a>

        <nav className="desktop-nav" aria-label="ناوبری اصلی">
          <button onClick={() => scrollTo("services")}>خدمات</button>
          <button onClick={() => scrollTo("order")}>ثبت سفارش</button>
          <button onClick={() => scrollTo("portfolio")}>نمونه‌کارها</button>
          <button onClick={() => scrollTo("enterprise")}>همکاری سازمانی</button>
          <button onClick={() => scrollTo("contact")}>تماس</button>
        </nav>

        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "فعال کردن تم روشن" : "فعال کردن تم تیره"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ opacity: 0, rotate: -30 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 30 }}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </motion.span>
            </AnimatePresence>
          </button>
          <button className="header-order" onClick={() => scrollTo("order")}>
            سفارش آنلاین
            <ArrowLeft size={17} />
          </button>
          {isAuthenticated ? (
            <button className="header-profile-badge" onClick={() => navigate("/profile")}>
              <User size={16} />
              {user?.name.slice(0, 8)}
            </button>
          ) : (
            <button className="header-login-button" onClick={() => navigate("/login")}>
              ورود
              <LogIn size={15} />
            </button>
          )}
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="باز کردن منو"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="mobile-nav"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            aria-label="ناوبری موبایل"
          >
            <button onClick={() => scrollTo("services")}>خدمات</button>
            <button onClick={() => scrollTo("order")}>ثبت سفارش</button>
            <button onClick={() => scrollTo("portfolio")}>نمونه‌کارها</button>
            <button onClick={() => scrollTo("enterprise")}>همکاری سازمانی</button>
            <button onClick={() => scrollTo("contact")}>تماس با ما</button>
          </motion.nav>
        )}
      </AnimatePresence>

      <main>
        <section className="hero" id="top">
          <motion.div
            className="hero-image"
            initial={{ scale: reduceMotion ? 1 : 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 1.5, ease: "easeOut" }}
          />
          <div className="hero-shade" />
          <motion.div
            className="hero-content page-width"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.85, delay: 0.2 }}
          >
            <p className="hero-brand">چاپ روشن</p>
            <h1>ایده‌های خوب، روی کاغذ ماندگار می‌شوند.</h1>
            <p className="hero-copy">
              از فایل تا تحویل، چاپ باکیفیت و شفاف برای برندهایی که به جزئیات اهمیت می‌دهند.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => scrollTo("order")}>
                شروع سفارش
                <ArrowLeft size={19} />
              </button>
              <button className="text-button light" onClick={() => scrollTo("portfolio")}>
                دیدن نمونه‌کارها
                <ArrowUpLeft size={18} />
              </button>
            </div>
          </motion.div>
          <button className="scroll-cue" onClick={() => scrollTo("services")} aria-label="رفتن به بخش بعد">
            <span />
          </button>
        </section>

        <section className="services-section page-width" id="services">
          <motion.div className="section-heading split-heading" {...reveal}>
            <div>
              <p className="eyebrow">از ایده تا تحویل</p>
              <h2>چاپ حرفه‌ای،<br />بدون پیچیدگی.</h2>
            </div>
            <p>
              هر سفارش را با دقت فنی، کنترل انسانی و انتخاب درست متریال جلو می‌بریم تا نتیجه دقیقاً همان چیزی باشد که انتظار دارید.
            </p>
          </motion.div>

          <div className="service-list">
            {serviceRows.map((service, index) => (
              <motion.article
                className="service-row"
                key={service.number}
                initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: reduceMotion ? 0 : 0.55, delay: index * 0.08 }}
              >
                <span>{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <ChevronLeft aria-hidden="true" />
              </motion.article>
            ))}
          </div>
        </section>

        <section className="partners-section" aria-label="برندهای همکار">
          <div className="partners-head">
            <p className="eyebrow">اعتماد شما، افتخار ما</p>
            <p className="partners-sub">برندهایی که چاپ‌شان را به ما سپرده‌اند</p>
          </div>
          <div className="marquee">
            <div className="marquee-track">
              {partners.map((partner) => (
                <span className={`partner-logo word-${partner.word}`} key={partner.name}>
                  <i className={`partner-mark mark-${partner.mark}`} aria-hidden="true" />
                  <strong>{partner.name}</strong>
                </span>
              ))}
              {partners.map((partner) => (
                <span className={`partner-logo word-${partner.word}`} key={`${partner.name}-dup`} aria-hidden="true">
                  <i className={`partner-mark mark-${partner.mark}`} aria-hidden="true" />
                  <strong>{partner.name}</strong>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="order-section" id="order">
          <div className="page-width">
            <motion.div className="section-heading order-heading" {...reveal}>
              <p className="eyebrow">سفارش آنلاین</p>
              <h2>سفارش چاپ، قدم به قدم</h2>
              <p>مشخصات را وارد کنید؛ قیمت اولیه همان لحظه محاسبه می‌شود.</p>
            </motion.div>

            <motion.div className="order-wizard" {...reveal}>
              {!orderSubmitted ? (
                <>
                  <div className="wizard-progress" aria-label="مراحل ثبت سفارش">
                    {wizardSteps.map((step, index) => (
                      <button
                        key={step}
                        className={index === wizardStep ? "active" : index < wizardStep ? "done" : ""}
                        onClick={() => index < wizardStep && setWizardStep(index)}
                        disabled={index > wizardStep}
                      >
                        <span>{index < wizardStep ? <Check size={15} /> : formatPrice(index + 1)}</span>
                        <em>{step}</em>
                      </button>
                    ))}
                  </div>

                  <div className="wizard-body">
                    <div className="wizard-form">
                      <AnimatePresence mode="wait">
                        <motion.div
                          className="step-content"
                          key={wizardStep}
                          initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                          transition={{ duration: reduceMotion ? 0 : 0.25 }}
                        >
                          {wizardStep === 0 && (
                            <ProductStep
                              selectedProduct={selectedProduct}
                              onSelect={setSelectedProduct}
                              products={productsList}
                            />
                          )}

                          {wizardStep === 1 && (
                            <DetailsStep
                              details={details}
                              setDetails={setDetails}
                              toggleFinish={toggleFinish}
                              finishes={finishesList}
                            />
                          )}

                          {wizardStep === 2 && (
                            <ContactStep
                              customer={customer}
                              setCustomer={setCustomer}
                              fileName={fileName}
                              setFileName={setFileName}
                              setFileBlob={setFileBlob}
                              error={formError}
                            />
                          )}

                          {wizardStep === 3 && (
                            <ReviewStep
                              product={product}
                              details={details}
                              customer={customer}
                              fileName={fileName}
                            />
                          )}
                        </motion.div>
                      </AnimatePresence>

                      <div className="wizard-controls">
                        {wizardStep > 0 && (
                          <button className="back-button" onClick={() => setWizardStep((step) => step - 1)}>
                            مرحله قبل
                          </button>
                        )}
                        {wizardStep < 3 ? (
                          <button className="primary-button" onClick={goNext}>
                            ادامه سفارش
                            <ArrowLeft size={18} />
                          </button>
                        ) : (
                          <button className="primary-button" onClick={submitOrder}>
                            ثبت درخواست
                            <Check size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    <aside className="order-summary">
                      <div>
                        <p className="summary-label">برآورد فعلی</p>
                        <h3>{formatPrice(estimatedPrice)} <small>تومان</small></h3>
                        <p className="summary-note">قیمت تقریبی است و پس از بررسی فایل نهایی می‌شود.</p>
                      </div>
                      <dl>
                        <div>
                          <dt>محصول</dt>
                          <dd>{product.title}</dd>
                        </div>
                        <div>
                          <dt>تیراژ</dt>
                          <dd>{formatPrice(details.quantity)} عدد</dd>
                        </div>
                        <div>
                          <dt>چاپ</dt>
                          <dd>{details.printSide}</dd>
                        </div>
                        <div>
                          <dt>خدمات تکمیلی</dt>
                          <dd>{details.finishes.length ? `${formatPrice(details.finishes.length)} مورد` : "بدون خدمات"}</dd>
                        </div>
                      </dl>
                      <p className="commerce-note">
                        <ShoppingBag size={17} />
                        آماده اتصال مستقیم به سبد خرید ووکامرس
                      </p>
                    </aside>
                  </div>
                </>
              ) : (
                <motion.div
                  className="success-state"
                  initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="success-icon"><Check /></span>
                  <p className="eyebrow">درخواست ثبت شد</p>
                  <h3>{customer.name} عزیز، سفارش شما به دست ما رسید.</h3>
                  <p>کارشناس چاپ روشن پس از بررسی مشخصات، از طریق شماره {customer.phone} با شما تماس می‌گیرد.</p>
                  <div className="success-code">کد پیگیری: چ‌ر {trackingCode}</div>
                  <button className="primary-button" onClick={restartOrder}>ثبت سفارش جدید</button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        <section className="portfolio-section page-width" id="portfolio">
          <motion.div className="section-heading portfolio-heading" {...reveal}>
            <div>
              <p className="eyebrow">منتخب پروژه‌ها</p>
              <h2>چاپی که می‌شود لمسش کرد.</h2>
            </div>
            <p>چند همکاری نزدیک با برندهایی که کیفیت چاپ را بخشی از تجربه محصول می‌دانند.</p>
          </motion.div>

          <div className="portfolio-grid">
            {portfolioList.map((work, index) => (
              <Link
                to={`/portfolio/${work.slug}`}
                className={work.className || undefined}
                key={work.slug}
              >
                <motion.figure
                  className={work.className}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: reduceMotion ? 0 : 0.65, delay: index * 0.08 }}
                >
                  <div className="portfolio-image-wrap">
                    <img src={work.image} alt={work.title} />
                    <span className="portfolio-arrow"><ArrowUpLeft /></span>
                  </div>
                  <figcaption>
                    <h3>{work.title}</h3>
                    <p>{work.category}</p>
                  </figcaption>
                </motion.figure>
              </Link>
            ))}
          </div>
        </section>

        <section className="process-section">
          <div className="page-width">
            <motion.div className="section-heading centered-heading" {...reveal}>
              <p className="eyebrow">روال همکاری</p>
              <h2>ساده، شفاف، قابل پیگیری</h2>
              <p>از ثبت مشخصات تا رسیدن بسته به دست شما، وضعیت سفارش روشن است.</p>
            </motion.div>
            <div className="process-grid">
              <motion.div {...reveal}>
                <span>۱</span>
                <Printer />
                <h3>ثبت مشخصات</h3>
                <p>نوع محصول، تیراژ و خدمات موردنظر را انتخاب می‌کنید.</p>
              </motion.div>
              <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
                <span>۲</span>
                <FileImage />
                <h3>بررسی فایل</h3>
                <p>فایل توسط کارشناس پیش از چاپ کنترل و قیمت قطعی اعلام می‌شود.</p>
              </motion.div>
              <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.2 }}>
                <span>۳</span>
                <Package />
                <h3>چاپ و تحویل</h3>
                <p>پس از تایید، سفارش چاپ، کنترل و برای شما ارسال می‌شود.</p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="org-section" id="enterprise">
          {/* ── stat bar ── */}
          <div className="org-stat-bar page-width">
            {orgStats.map((stat) => (
              <div className="org-stat" key={stat.label}>
                <span>{stat.value}</span>
                <small>{stat.label}</small>
              </div>
            ))}
          </div>

          {/* ── main layout ── */}
          <div className="page-width">
            <div className="org-layout">
              {/* left column */}
              <motion.div className="org-main" {...reveal}>
                <div className="org-head">
                  <p className="eyebrow">ارگان‌ها و پروژه‌های شهری</p>
                  <h2>همکاری سازمانی،<br />رویه‌ای متفاوت دارد.</h2>
                </div>
                <p className="org-desc">
                  سفارش‌های انبوه سازمانی، مناقصات و کمپین‌های سطح شهر از ویزارد آنلاین عبور نمی‌کنند.
                  این پروژه‌ها با مشاوره تخصصی، جلسه حضوری و قرارداد رسمی توسط تیم اختصاصی اجرا می‌شوند.
                </p>

                {/* services grid */}
                <div className="org-services">
                  {orgServices.map((service, i) => {
                    const Icon = service.icon;
                    return (
                      <motion.div
                        className="org-service-card"
                        key={service.label}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.45, delay: i * 0.06 }}
                      >
                        <div className="org-service-icon"><Icon size={22} /></div>
                        <div>
                          <h4>{service.label}</h4>
                          <p>{service.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* steps */}
                <div className="org-steps">
                  <div className="org-steps-head">
                    <p className="eyebrow">رویه قراردادی</p>
                    <h3>از تماس اول تا تحویل نهایی</h3>
                  </div>
                  <div className="org-steps-track">
                    {orgSteps.map((step, i) => {
                      const Icon = step.icon;
                      return (
                        <motion.div
                          className="org-step"
                          key={step.num}
                          initial={{ opacity: 0, x: 16 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.5 }}
                          transition={{ duration: 0.4, delay: i * 0.08 }}
                        >
                          <div className="org-step-num">{step.num}</div>
                          <div className="org-step-icon"><Icon size={20} /></div>
                          <div className="org-step-body">
                            <h4>{step.title}</h4>
                            <p>{step.text}</p>
                          </div>
                          {i < orgSteps.length - 1 && <div className="org-step-line" />}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* right column — sticky contact card */}
              <motion.aside
                className="org-contact"
                {...reveal}
                transition={{ ...reveal.transition, delay: 0.12 }}
              >
                <span className="org-badge">
                  <Handshake size={13} />
                  رویه قراردادی
                </span>
                <h3>خط مستقیم سازمانی</h3>
                <p className="org-contact-sub">شنبه تا پنجشنبه، ساعت ۹ تا ۱۸</p>
                <a href="tel:+982188745211" className="org-phone" dir="ltr">
                  ۰۲۱ ۸۸۷۴ ۵۲۱۱
                </a>
                <div className="org-divider" />
                {!orgSubmitted ? (
                  <form className="org-form" onSubmit={submitOrgRequest} noValidate>
                    <p className="org-form-title">درخواست جلسه مشاوره</p>
                    <label>
                      <span>نام و نام خانوادگی *</span>
                      <input
                        type="text"
                        value={orgForm.name}
                        onChange={(e) => setOrgForm((c) => ({ ...c, name: e.target.value }))}
                        placeholder="مثلاً مهندس کریمی"
                      />
                    </label>
                    <label>
                      <span>نام سازمان / شرکت *</span>
                      <input
                        type="text"
                        value={orgForm.org}
                        onChange={(e) => setOrgForm((c) => ({ ...c, org: e.target.value }))}
                        placeholder="مثلاً شهرداری منطقه ۵"
                      />
                    </label>
                    <label>
                      <span>شماره تماس *</span>
                      <input
                        type="tel"
                        dir="ltr"
                        value={orgForm.phone}
                        onChange={(e) => setOrgForm((c) => ({ ...c, phone: e.target.value.replace(/[^0-9]/g, "") }))}
                        placeholder="09123456789"
                      />
                    </label>
                    {orgError && <p className="form-error">{orgError}</p>}
                    <button className="primary-button" type="submit">
                      ثبت درخواست تماس
                      <PhoneCall size={16} />
                    </button>
                    <p className="org-form-note">حداکثر تا یک روز کاری با شما تماس می‌گیریم.</p>
                  </form>
                ) : (
                  <div className="org-success">
                    <span className="org-success-check"><Check size={28} /></span>
                    <h4>درخواست ثبت شد</h4>
                    <p>
                      {orgForm.name} عزیز، تیم سازمانی برای هماهنگی جلسه با {orgForm.org} در تماس خواهد بود.
                    </p>
                    <button className="back-button" onClick={resetOrgRequest}>ثبت درخواست جدید</button>
                  </div>
                )}
              </motion.aside>
            </div>
          </div>
        </section>

        <section className="closing-section" id="contact">
          <div className="closing-art" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <motion.div className="page-width closing-content" {...reveal}>
            <p className="eyebrow">برای یک شروع خوب</p>
            <h2>آماده‌اید ایده بعدی را چاپ کنیم؟</h2>
            <p>برای مشاوره متریال، تیراژ یا آماده‌سازی فایل با ما حرف بزنید.</p>
            <div className="closing-actions">
              <button className="primary-button inverted" onClick={() => scrollTo("order")}>
                ثبت سفارش آنلاین
                <ArrowLeft size={19} />
              </button>
              <a href="tel:+982188745210" className="closing-phone">
                <Phone size={19} />
                ۰۲۱ ۸۸۷۴ ۵۲۱۰
              </a>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width footer-main">
          <div className="footer-brand">
            <a className="nav-brand" href="#top">
              <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
              <span>چاپ روشن</span>
            </a>
            <p>چاپ دقیق برای ایده‌های ماندگار.</p>
          </div>
          <div className="footer-links">
            <p>دسترسی سریع</p>
            <button onClick={() => scrollTo("services")}>خدمات چاپ</button>
            <button onClick={() => scrollTo("portfolio")}>نمونه‌کارها</button>
            <button onClick={() => scrollTo("enterprise")}>همکاری سازمانی</button>
            <button onClick={() => scrollTo("order")}>پیگیری سفارش</button>
          </div>
          <div className="footer-contact">
            <p>ارتباط با ما</p>
            <a href="mailto:hello@chaproshan.ir">hello@chaproshan.ir</a>
            <a href="tel:+982188745210">۰۲۱ ۸۸۷۴ ۵۲۱۰</a>
            <a href="#instagram"><AtSign size={17} /> اینستاگرام</a>
          </div>
        </div>
        <div className="page-width footer-bottom">
          <p>تمام حقوق برای چاپ روشن محفوظ است.</p>
          <p>طراحی شده برای اتصال به وردپرس، المنتور و ووکامرس</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
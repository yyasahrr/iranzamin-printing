import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Printer, 
  User, 
  Search, 
  Bell, 
  MessageSquare, 
  Plus, 
  TrendingUp, 
  ShoppingBag, 
  Check, 
  Users, 
  Clock, 
  Calendar, 
  ArrowUpLeft, 
  Settings, 
  FileText, 
  Cpu, 
  ShieldAlert, 
  Package, 
  Truck, 
  Activity, 
  DollarSign, 
  X,
  Sparkles,
  Award,
  AlertCircle,
  Play,
  Pause,
  AlertTriangle,
  History,
  FileCheck,
  CheckSquare,
  Zap,
  BarChart,
  List,
  Mail,
  Phone,
  Bookmark,
  Building,
  MapPin,
  Percent,
  TrendingDown,
  UserCheck,
  Briefcase,
  Download,
  PercentCircle,
  FileSpreadsheet,
  Edit,
  Eye,
  Settings2,
  GitBranch,
  Copy,
  Trash2,
  FileJson,
  Upload,
  Layers
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AppButton from "../components/core/AppButton";
import AppCard from "../components/core/AppCard";
import AppInput from "../components/core/AppInput";
import AppBadge, { type BadgeStatus } from "../components/core/AppBadge";
import AppModal from "../components/core/AppModal";

type AdminRole = "owner" | "designer" | "printer" | "finance" | "support";
type ActiveSection = "dashboard" | "orders" | "operations" | "crm" | "reports" | "settings" | "cms";
type OperationsSubTab = "kanban" | "gantt" | "capacity" | "analytics";
type CRMTab = "overview" | "notes" | "b2b" | "discounts";
type FinanceSubTab = "accounting" | "transactions" | "coupons";
type SettingsSubTab = "resources" | "automation" | "wizard_builder";

interface CRMUser {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  isVIP: boolean;
  score: number; // 0 - 100
  health: "healthy" | "risk" | "inactive" | "lost";
  ltv: number; // Lifetime Value
  totalOrders: number;
  tags: string[];
  registeredAt: string;
  creditLimit: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [currentRole, setCurrentRole] = useState<AdminRole>("owner");
  const [activeSection, setActiveSection] = useState<ActiveSection>("settings");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // زیر‌تب‌های کارگاه
  const [opsSubTab, setOpsSubTab] = useState<OperationsSubTab>("kanban");
  
  // زیر‌تب‌های مالی
  const [financeSubTab, setFinanceSubTab] = useState<FinanceSubTab>("accounting");

  // زیر‌تب‌های تنظیمات و موتور اتوماسیون (Business Engine)
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>("wizard_builder");

  // زیر‌تب‌های مدیریت محتوا و CMS
  const [cmsSubTab, setCmsSubTab] = useState<"posts" | "pages" | "media" | "faq">("posts");

  // کامند پلت (Command Palette - Ctrl + K)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  // رفرش خودکار ۳۰ ثانیه‌ای
  const [lastRefreshTime, setLastRefreshTime] = useState<string>("");
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);

  // مودال‌های کارگاهی
  const [activeReviewJob, setActiveReviewJob] = useState<any | null>(null);
  const [activeQCJob, setActiveQCJob] = useState<any | null>(null);
  
  // مدیریت مشتریان ۳۶۰ درجه
  const [selectedCRMUser, setSelectedCRMUser] = useState<CRMUser | null>(null);
  const [crmTab, setCrmTab] = useState<CRMTab>("overview");
  const [crmSearchQuery, setCrmSearchQuery] = useState("");
  const [crmFilter, setCrmFilter] = useState<string>("all");
  const [crmSort, setCrmSort] = useState<string>("newest");
  
  // یادداشت‌های ادمین برای مشتری خاص
  const [customerNotes, setCustomerNotes] = useState<Record<string, string>>({
    "CU-10112": "مشتری نسبت به رنگ‌های پانتون حساس است. قبل از چاپ زینک حتما تایید نمونه پلاتر گرفته شود.",
    "CU-10113": "همیشه قبل از ارسال بسته‌ها هماهنگی تلفنی صورت گیرد. تسویه‌ها در مدت زمان معین ۳۰ روزه انجام می‌شود."
  });
  const [noteInput, setNoteInput] = useState("");

  // ==========================================
  // فاز هفتم بخش دوم: طراح گرافیکی ویزارد (Visual Wizard Builder & Form Engine)
  // ==========================================
  const [isNewWizardModalOpen, setIsNewWizardModalOpen] = useState(false);
  const [formEngineType, setFormEngineType] = useState<string>("order_form"); // order_form, consulting_form, job_form, complaint_form

  // لیست ویزاردها/فرم‌های ساخته شده
  const [wizards, setWizards] = useState<any[]>([
    { id: "wiz-1", name: "ویزارد کارت ویزیت افست", category: "stationary", version: "v3", status: "published", type: "order_form", lastEdit: "امروز ۱۰:۰۰", creator: "مهندس علوی" },
    { id: "wiz-2", name: "ویزارد کاتالوگ و کتابچه لوکس", category: "stationary", version: "v2", status: "published", type: "order_form", lastEdit: "دیروز ۱۴:۰۰", creator: "سارا احمدی" },
    { id: "wiz-3", name: "فرم درخواست مشاوره سازمان‌ها", category: "other", version: "v1", status: "published", type: "consulting_form", lastEdit: "۳ روز پیش", creator: "محمد حیدری" },
    { id: "wiz-4", name: "فرم استخدام طراح و اپراتور کارگاه", category: "other", version: "v1", status: "draft", type: "job_form", lastEdit: "۱ هفته پیش", creator: "مهندس علوی" }
  ]);

  // مشخصات ویزارد در حال طراحی
  const [selectedWizard, setSelectedWizard] = useState<any>(null);
  const [designerSteps, setDesignerSteps] = useState<any[]>([
    { id: "step-1", title: "انتخاب محصول", fields: [
      { id: "f-1", name: "product_type", label: "نوع محصول", type: "select", options: ["لمینت مات", "سلفون براق", "کتان امباس"], required: true }
    ]},
    { id: "step-2", title: "ابعاد و جهت چاپ", fields: [
      { id: "f-2", name: "dimensions", label: "ابعاد برش", type: "select", options: ["استاندارد ۹×۶", "مربع ۶×۶", "پروانه‌ای عریض"], required: true },
      { id: "f-3", name: "print_sides", label: "نوع چاپ", type: "radio", options: ["یک رو رنگی", "دو رو رنگی"], required: true }
    ]},
    { id: "step-3", title: "آپلود طرح و فایل ناظر", fields: [
      { id: "f-4", name: "design_file", label: "طرح لایه‌باز (PDF)", type: "file", required: true }
    ]}
  ]);

  const [activeStepId, setActiveStepId] = useState<string>("step-1");
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>("f-1");
  
  // شبیه‌ساز منطق قیمت‌گذاری فرمول‌ساز (Formula Builder)
  const [formulaBasePrice, setFormulaBasePrice] = useState("4200");
  const [formulaPaperFactor, setFormulaPaperFactor] = useState("1.12");
  const [formulaLaminationFactor, setFormulaLaminationFactor] = useState("0.12");

  // چک‌لیست‌های پیش‌پرواز فایل
  const [fileChecklist, setFileChecklist] = useState({
    resolution: true,
    bleed: false,
    colorMode: true,
    fonts: true,
    size: false,
    transparency: true,
    layers: true,
    linkedImages: true
  });

  const [qcChecklist, setQcChecklist] = useState({
    colors: false,
    alignment: false,
    cut: false,
    quality: false,
    paper: false,
    packaging: false
  });

  // کارهای کارگاهی چاپی با معماری کار-محور (Job-Centric Specs)
  const [jobs, setJobs] = useState<any[]>([
    { id: "JOB-101", orderId: "CR-9921", product: "کارت ویزیت لمینت براق", customer: "کافه رُست", qty: 1000, status: "review", designer: "سارا", supplier: "دستگاه افست هایدلبرگ", deadline: "امروز ۱۷:۰۰", hoursRemaining: 2, priority: "high", isVIP: false },
    { id: "JOB-102", orderId: "CR-9922", product: "کاتالوگ معماری لوکس", customer: "دفتر معماری فرم نو", qty: 500, status: "design", designer: "علی", supplier: "چاپ دیجیتال کونیکا", deadline: "فردا ۱۰:۰۰", hoursRemaining: 18, priority: "medium", isVIP: false },
    { id: "JOB-103", orderId: "CR-9923", product: "بسته‌بندی عسل طبیعی", customer: "برند طبیعی آویشن", qty: 2000, status: "printing", designer: "سارا", supplier: "دستگاه افست هایدلبرگ", deadline: "۲ روز دیگر", hoursRemaining: 48, priority: "medium", isVIP: false },
    { id: "JOB-104", orderId: "CR-9924", product: "استیکر و لیبل شیشه‌ای", customer: "شرکت بهداشتی گلبرگ", qty: 5000, status: "qc", designer: "محمد", supplier: "برش نیم‌تیغ اتوماتیک", deadline: "امروز ۱۸:۰۰", hoursRemaining: 3, priority: "high", isVIP: true },
    { id: "JOB-105", orderId: "CR-9925", product: "پوستر تبلیغاتی همایش", customer: "سازمان بنادر ایران", qty: 100, status: "packaging", designer: "محمد", supplier: "—", deadline: "امروز ۲۰:۰۰", hoursRemaining: 5, priority: "low", isVIP: false }
  ]);

  // رویدادهای مانیتورینگ اودیت لاگ تولید (Production Live Feed)
  const [activities, setActivities] = useState<any[]>([
    { id: 1, type: "production", text: "تکمیل بررسی فنی فایل JOB-101 توسط طراح ناظر (سارا)", time: "۳ دقیقه پیش", user: "سارا احمدی" },
    { id: 2, type: "production", text: "ارسال JOB-104 به بخش کنترل کیفیت چاپ (QC)", time: "۱۲ دقیقه پیش", user: "رضا (ناظر چاپ)" },
    { id: 3, type: "system", text: "تغییر هوشمند اولویت JOB-104 به حالت اضطراری VIP", time: "۲۴ دقیقه پیش", user: "سیستم خودکار" },
    { id: 4, type: "production", text: "پایان چاپ فرم عمومی کارت ویزیت کتان و ارجاع به برش‌کاری", time: "۴۰ دقیقه پیش", user: "احمد علوی (اپراتور چاپ)" }
  ]);

  // داده‌های مانیتورینگ CRM
  const [customers, setCustomers] = useState<CRMUser[]>([
    { id: "1", code: "CU-10112", name: "علی رضایی", phone: "09121111111", email: "ali@rost.cafe", company: "کافه رُست", isVIP: true, score: 95, health: "healthy", ltv: 12400000, totalOrders: 14, tags: ["VIP", "Gold", "Wholesale", "Loyal"], registeredAt: "۱۴۰۳/۰۴/۱۵", creditLimit: 20000000 },
    { id: "2", code: "CU-10113", name: "امیر کاظمی", phone: "09122222222", email: "kazemi@formnow.co", company: "دفتر معماری فرم نو", isVIP: true, score: 85, health: "healthy", ltv: 34500000, totalOrders: 28, tags: ["VIP", "Gold", "Agency"], registeredAt: "۱۴۰۲/۰۶/۱۰", creditLimit: 50000000 },
    { id: "3", code: "CU-10114", name: "مریم حیدری", phone: "09123333333", email: "m.heidari@avishan.com", company: "صنایع طبیعی آویشن", isVIP: false, score: 72, health: "risk", ltv: 4500000, totalOrders: 5, tags: ["Student", "Designer"], registeredAt: "۱۴۰۴/۰۱/۲۵", creditLimit: 5000000 },
    { id: "4", code: "CU-10115", name: "احمد علوی", phone: "09124444444", email: "alavi@ports.gov", company: "سازمان بنادر ایران", isVIP: false, score: 40, health: "inactive", ltv: 0, totalOrders: 0, tags: ["Inactive"], registeredAt: "۱۴۰۵/۰۲/۱۴", creditLimit: 0 }
  ]);

  const [transactions, setTransactions] = useState<any[]>([
    { id: "TX-9021", orderCode: "CR-9921", customer: "علی رضایی", amount: 1240000, status: "paid", gateway: "بانک ملت (آنلاین)", refNo: "REF-8849201", date: "امروز ۱۰:۱۲" },
    { id: "TX-9022", orderCode: "CR-9922", customer: "امیر کاظمی", amount: 3400000, status: "paid", gateway: "بانک سامان (آنلاین)", refNo: "REF-8849202", date: "دیروز ۱۴:۴۵" },
    { id: "TX-9023", orderCode: "CR-9923", customer: "مریم حیدری", amount: 250000, status: "pending", gateway: "کارت به کارت", refNo: "—", date: "دیروز ۱۸:۰۰" },
  ]);

  const [automationRules, setAutomationRules] = useState<any[]>([
    { id: 1, title: "ارسال اس‌ام‌اس تاییدیه تراکنش پس از پرداخت موفق", trigger: "PaymentCompleted", action: "ارسال اس‌ام‌اس خودکار به مشتری گیرنده", is_active: true },
    { id: 2, title: "انتساب خودکار طراح ناظر به کارهای تازه ثبت شده ورودی", trigger: "OrderCreated", action: "تخصیص طراح ناظر به آتلیه", is_active: true },
    { id: 3, title: "ارجاع خودکار کار به آتلیه طراحی در صورت رد صلاحیت کیفی", trigger: "QCFailed", action: "بازگشت کار به فاز طراحی", is_active: true }
  ]);

  const [automationLogs, setAutomationLogs] = useState<any[]>([
    { id: "L-2041", ruleTitle: "ارسال اس‌ام‌اس تاییدیه تراکنش پس از پرداخت", status: "executed", time: "۵ دقیقه پیش", detail: "اس‌ام‌اس با موفقیت به شماره 09121111111 فرستاده شد." },
    { id: "L-2042", ruleTitle: "انتساب خودکار طراح ناظر", status: "executed", time: "۱۲ دقیقه پیش", detail: "کار JOB-101 با موفقیت به اپراتور سارا احمدی منتسب گردید." },
    { id: "L-2043", ruleTitle: "ارجاع خودکار کار به آتلیه در صورت رد QC", status: "skipped", time: "۴۰ دقیقه پیش", detail: "سفارش JOB-104 پاس شد، نیازی به ارجاع نبود." }
  ]);

  const [machines, setMachines] = useState([
    { id: "M1", name: "دستگاه افست هایدلبرگ ۴ رنگ", load: 85, status: "running", usedHours: 6.8, totalHours: 8 },
    { id: "M2", name: "چاپ دیجیتال کونیکا مینوتا C6000", load: 40, status: "idle", usedHours: 3.2, totalHours: 8 },
    { id: "M3", name: "برش و دایکات تمام اتوماتیک پلار", load: 95, status: "running", usedHours: 7.6, totalHours: 8 },
    { id: "M4", name: "دستگاه لترپرس و طلاکوب تخت", load: 15, status: "paused", usedHours: 1.2, totalHours: 8 }
  ]);

  const designers = [
    { name: "سارا احمدی", jobCount: 4, status: "overloaded", efficiency: "۹۴٪", avgTime: "۴۵ دقیقه" },
    { name: "علی کریمی", jobCount: 2, status: "normal", efficiency: "۸۸٪", avgTime: "۶۰ دقیقه" },
    { name: "محمد حیدری", jobCount: 6, status: "overloaded", efficiency: "۹۶٪", avgTime: "۳۵ دقیقه" }
  ];

  const kanbanColumns = [
    { id: "review", title: "بررسی فنی فایل" },
    { id: "design", title: "آتلیه طراحی" },
    { id: "printing", title: "کارگاه چاپ" },
    { id: "qc", title: "کنترل کیفیت (QC)" },
    { id: "packaging", title: "بسته‌بندی" },
    { id: "shipping", title: "تحویل و ارسال" }
  ];

  // رفرش خودکار داده‌ها
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLastRefreshTime(now.toLocaleTimeString("fa-IR"));
    };
    updateTime();

    const interval = setInterval(() => {
      setRefreshCountdown((c) => {
        if (c <= 1) {
          updateTime();
          const randId = Math.floor(Math.random() * 1000);
          const logs = [
            "تغییر شیفت کارگاه چاپ به شیفت عصرگاهی",
            "دستگاه دایکات پلار وارد فاز روان‌کاری دوره‌ای شد",
            "پیام جدید طراح به مشتری در خصوص اصلاح کادر حاشیه برش",
            "بررسی فنی موفق فایل طرح کاتالوگ معماری"
          ];
          const randomLog = logs[Math.floor(Math.random() * logs.length)];
          setActivities((prev) => [
            { id: randId, type: "production", text: randomLog, time: "همین الان", user: "سرپرست کارگاه" },
            ...prev.slice(0, 4)
          ]);
          return 30;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // میانبرهای کیبورد
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        if (e.key === "n") {
          e.preventDefault();
          alert("فرم تعریف کار چاپی جدید باز شد.");
        }
        if (e.key === "/") {
          e.preventDefault();
          document.getElementById("global-search-input")?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // فلو و جابجایی دستی کارها روی تخته کانبان
  const moveJobStatus = (jobId: string, newStatus: string) => {
    const updated = jobs.map(j => {
      if (j.id === jobId) {
        const randId = Math.floor(Math.random() * 1000);
        const oldDisplay = kanbanColumns.find(c => c.id === j.status)?.title || j.status;
        const newDisplay = kanbanColumns.find(c => c.id === newStatus)?.title || newStatus;
        setActivities(prev => [
          { id: randId, type: "production", text: `جابجایی کار ${j.id} از [${oldDisplay}] به [${newDisplay}]`, time: "همین الان", user: "اپراتور ارشد" },
          ...prev
        ]);
        return { ...j, status: newStatus };
      }
      return j;
    });
    setJobs(updated);
  };

  const toggleJobVIP = (jobId: string) => {
    const updated = jobs.map(j => {
      if (j.id === jobId) {
        const nextVIP = !j.isVIP;
        const randId = Math.floor(Math.random() * 1000);
        setActivities(prev => [
          { id: randId, type: "system", text: nextVIP ? `🚨 حالت اضطراری VIP برای کار ${j.id} فعال شد (ارجاع به اول صف تولید)` : `حالت VIP برای کار ${j.id} لغو شد.`, time: "همین الان", user: "مدیر کارگاه" },
          ...prev
        ]);
        return { ...j, isVIP: nextVIP, priority: nextVIP ? "high" : j.priority };
      }
      return j;
    });
    setJobs(updated);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return j.customer.toLowerCase().includes(q) || j.product.toLowerCase().includes(q) || j.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [jobs, searchQuery]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        if (crmFilter === "vip" && !c.isVIP) return false;
        if (crmFilter === "inactive" && c.health !== "inactive") return false;
        if (crmFilter === "active" && c.health !== "healthy") return false;
        
        if (crmSearchQuery.trim() !== "") {
          const q = crmSearchQuery.toLowerCase();
          return (
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (crmSort === "newest") return b.id.localeCompare(a.id);
        if (crmSort === "revenue") return b.ltv - a.ltv;
        if (crmSort === "orders") return b.totalOrders - a.totalOrders;
        return 0;
      });
  }, [customers, crmFilter, crmSearchQuery, crmSort]);

  // متدهای ویرایش و توسعه Visual Wizard Builder
  const handleAddNewField = (stepId: string, fieldType: string) => {
    const fieldId = `f-${Date.now()}`;
    const newField = {
      id: fieldId,
      name: `custom_field_${Date.now().toString().slice(-4)}`,
      label: `فیلد انتخابی جدید (${fieldType})`,
      type: fieldType,
      options: ["گزینه اول", "گزینه دوم"],
      required: false
    };
    
    const updatedSteps = designerSteps.map(step => {
      if (step.id === stepId) {
        return { ...step, fields: [...step.fields, newField] };
      }
      return step;
    });
    setDesignerSteps(updatedSteps);
    setSelectedFieldId(fieldId);
  };

  const handleUpdateFieldLabel = (fieldId: string, newLabel: string) => {
    const updatedSteps = designerSteps.map(step => {
      const updatedFields = step.fields.map((f: any) => {
        if (f.id === fieldId) {
          return { ...f, label: newLabel };
        }
        return f;
      });
      return { ...step, fields: updatedFields };
    });
    setDesignerSteps(updatedSteps);
  };

  const activeStep = designerSteps.find(s => s.id === activeStepId) || designerSteps[0];
  const selectedField = useMemo(() => {
    for (const step of designerSteps) {
      const found = step.fields.find((f: any) => f.id === selectedFieldId);
      if (found) return found;
    }
    return null;
  }, [designerSteps, selectedFieldId]);

  // دریافت خروجی زنده کدهای فرمول‌ساز و مدل JSON ویزارد جهت انتقال (Export JSON)
  const wizardJSONOutput = useMemo(() => {
    return JSON.stringify({
      wizard_name: selectedWizard?.name || "ویزارد جدید چاپخانه",
      engine_type: formEngineType,
      version: "1.0",
      steps: designerSteps,
      pricing_formula: {
        base_price: Number(formulaBasePrice),
        paper_factor: Number(formulaPaperFactor),
        lamination_factor: Number(formulaLaminationFactor)
      }
    }, null, 2);
  }, [selectedWizard, formEngineType, designerSteps, formulaBasePrice, formulaPaperFactor, formulaLaminationFactor]);

  return (
    <div className="profile-shell" dir="rtl" style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      
      {/* ==========================================
          ۱. سایدبار ناوبری ادمین (Sidebar)
          ========================================== */}
      <aside className="profile-sidebar" style={{
        width: isSidebarCollapsed ? "80px" : "260px",
        background: "var(--surface)",
        borderLeft: "1px solid var(--line)",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        position: "sticky",
        top: "0",
        height: "100vh",
        zIndex: "100",
        transition: "width 0.3s ease"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {!isSidebarCollapsed && (
            <div className="nav-brand" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
              <span style={{ fontSize: "16px", fontWeight: "bold", color: "var(--text)" }}>فرماندهی روشن</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            style={{ background: "none", border: "0", color: "var(--color-text-muted, var(--muted))", cursor: "pointer", marginRight: isSidebarCollapsed ? "auto" : "0" }}
          >
            {isSidebarCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {!isSidebarCollapsed && (
          <div style={{ background: "var(--surface-soft)", padding: "10px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: "bold" }}>میز کار زنده بر اساس نقش:</span>
            <select 
              value={currentRole} 
              onChange={(e) => setCurrentRole(e.target.value as AdminRole)}
              style={{
                width: "100%", height: "32px", fontSize: "12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "4px", color: "var(--text)", outline: "none"
              }}
            >
              <option value="owner">مالک کارخانه (Owner Dashboard)</option>
              <option value="designer">طراح ناظر آتلیه</option>
              <option value="printer">اپراتور کارگاه چاپ فیزیکی</option>
              <option value="finance">مدیر حسابداری و فاکتورها</option>
              <option value="support">پشتیبانی و تیکت‌ها</option>
            </select>
          </div>
        )}

        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1" }} className="profile-tabs">
          <button className={activeSection === "dashboard" ? "active" : ""} onClick={() => setActiveSection("dashboard")}>
            <Activity size={16} /> {!isSidebarCollapsed && "میز کار ادمین"}
          </button>
          <button className={activeSection === "operations" ? "active" : ""} onClick={() => setActiveSection("operations")}>
            <Cpu size={16} /> {!isSidebarCollapsed && "صف کارگاه (Operations)"}
          </button>
          <button className={activeSection === "orders" ? "active" : ""} onClick={() => setActiveSection("orders")}>
            <Printer size={16} /> {!isSidebarCollapsed && "مدیریت سفارشات"}
          </button>
          <button className={activeSection === "crm" ? "active" : ""} onClick={() => setActiveSection("crm")}>
            <Users size={16} /> {!isSidebarCollapsed && "مشتریان و CRM"}
          </button>
          <button className={activeSection === "reports" ? "active" : ""} onClick={() => setActiveSection("reports")}>
            <FileText size={16} /> {!isSidebarCollapsed && "حسابداری و گزارش‌ها"}
          </button>
          <button className={activeSection === "settings" ? "active" : ""} onClick={() => setActiveSection("settings")}>
            <Settings size={16} /> {!isSidebarCollapsed && "تنظیمات کارخانه"}
          </button>
          <button className={activeSection === "cms" ? "active" : ""} onClick={() => setActiveSection("cms")}>
            <Layers size={16} /> {!isSidebarCollapsed && "مدیریت محتوا و CMS"}
          </button>
        </nav>

        <button className="settings-logout" onClick={() => navigate("/")} style={{
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
          <LogOut size={16} /> {!isSidebarCollapsed && "بازگشت به سایت"}
        </button>
      </aside>

      {/* ==========================================
          ۲. هدر مرکزی فرماندهی
          ========================================== */}
      <div style={{ flex: "1", display: "flex", flexDirection: "column", minWidth: "0" }}>
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
          {/* سرچ سراسری فاز پنجم (Global Search) */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "350px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", right: "12px", color: "var(--color-text-muted)" }} />
            <input 
              id="global-search-input"
              type="text" 
              placeholder="جستجو بر اساس سفارش، مشتری، فایل، دستگاه و پیمانکار چاپی... [/]" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                paddingRight: "38px",
                paddingLeft: "12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                color: "var(--text)",
                outline: "none",
                fontSize: "12px"
              }} 
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.02)", padding: "6px 12px", borderRadius: "30px", border: "1px solid var(--line)" }}>
              <Clock size={12} />
              <span>بروزرسانی در {refreshCountdown} ثانیه دیگر (ساعت زنده: {lastRefreshTime})</span>
            </div>

            <AppButton variant="outline" onClick={() => setIsCommandPaletteOpen(true)} style={{ minHeight: "36px", fontSize: "12px", padding: "0 12px" }}>
              کامند پلت <span style={{ fontFamily: "monospace", opacity: "0.6", marginRight: "4px" }}>Ctrl+K</span>
            </AppButton>

            <button className="theme-toggle" onClick={() => navigate("/")}>
              <ArrowUpLeft size={17} />
            </button>
          </div>
        </header>

        {/* شبکه‌بندی داشبورد بر اساس راست‌پنل داینامیک */}
        <div style={{ display: "grid", gridTemplateColumns: rightPanelExpanded ? "1fr 320px" : "1fr", transition: "all 0.3s ease", flex: "1" }}>
          
          <main style={{ padding: "32px", minWidth: "0" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                
                {/* ==========================================
                    WIDGET 1: DASHBOARD HOME (میز کار زنده ادمین)
                    ========================================== */}
                {activeSection === "dashboard" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                      <div>
                        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text)" }}>داشبورد متمرکز فرماندهی</h1>
                        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>امروز دوشنبه - دسترسی بر اساس نقش: **{currentRole.toUpperCase()}**</p>
                      </div>
                      <AppButton variant="primary" icon={<Plus size={16} />} onClick={() => setIsCommandPaletteOpen(true)}>
                        ایجاد سریع فاکتور / کار تولیدی
                      </AppButton>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                      <AppCard variant="statistic" onClick={() => { setActiveSection("operations"); setOpsSubTab("kanban"); }} style={{ cursor: "pointer" }}>
                        <span style={{ fontSize: "24px", fontWeight: "bold", color: "var(--accent)" }}>{jobs.filter(j => j.status === 'review').length} کار</span>
                        <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "12px", marginTop: "4px" }}>⏳ در انتظار بررسی فنی فایل ناظر</small>
                      </AppCard>
                      <AppCard variant="statistic" onClick={() => { setActiveSection("operations"); setOpsSubTab("kanban"); }} style={{ cursor: "pointer" }}>
                        <span style={{ fontSize: "24px", fontWeight: "bold", color: "#c084fc" }}>{jobs.filter(j => j.status === 'printing').length} کار</span>
                        <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "12px", marginTop: "4px" }}>🖨️ فرم‌های فعال در بخش لیتوگرافی و چاپ</small>
                      </AppCard>
                      <AppCard variant="statistic" onClick={() => { setActiveSection("operations"); setOpsSubTab("kanban"); }} style={{ cursor: "pointer" }}>
                        <span style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>{jobs.filter(j => j.isVIP).length} سفارش</span>
                        <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "12px", marginTop: "4px" }}>🚨 سفارشات اضطراری VIP فعال کارگاه</small>
                      </AppCard>
                      <AppCard variant="statistic" onClick={() => setActiveSection("crm")} style={{ cursor: "pointer" }}>
                        <span style={{ fontSize: "24px", fontWeight: "bold", color: "#38bdf8" }}>۹۸٪</span>
                        <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "12px", marginTop: "4px" }}>⭐ درصد رضایت و تحویل به موقع کارها</small>
                      </AppCard>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "24px" }}>
                      
                      <AppCard variant="default">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>کارهای فعال کارگاهی (رصد فوری)</h3>
                          <AppButton variant="ghost" onClick={() => { setActiveSection("operations"); setOpsSubTab("kanban"); }} style={{ minHeight: "30px", fontSize: "12px" }}>کل کارگاه &larr;</AppButton>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {jobs.map(job => (
                            <div key={job.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: job.isVIP ? "2px solid #ef4444" : "1px solid var(--line)", borderRadius: "8px", background: job.isVIP ? "rgba(239, 68, 68, 0.03)" : "transparent" }}>
                              <div>
                                <span style={{ display: "block", fontWeight: "bold", fontSize: "13px" }}>{job.product} {job.isVIP && <span style={{ color: "#ef4444", fontSize: "10px", background: "rgba(239,68,68,0.1)", padding: "2px 6px", borderRadius: "4px" }}>VIP 🚨</span>}</span>
                                <small style={{ color: "var(--color-text-muted)" }}>شناسه: {job.id} &bull; مشتری: {job.customer}</small>
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--color-text-muted)" }}>بخش: {kanbanColumns.find(c => c.id === job.status)?.title}</span>
                            </div>
                          ))}
                        </div>
                      </AppCard>

                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <AppCard variant="default">
                          <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "bold" }}>⚡ وضعیت ظرفیت زنده ماشین‌ها</h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {machines.map(m => (
                              <div key={m.id} style={{ fontSize: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                  <span>{m.name}</span>
                                  <strong style={{ color: m.load >= 80 ? '#ef4444' : 'var(--accent)' }}>{m.usedHours}/{m.totalHours} ساعت</strong>
                                </div>
                                <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                                  <div style={{ width: `${m.load}%`, height: "100%", background: m.load >= 80 ? '#ef4444' : 'var(--accent)' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </AppCard>
                      </div>

                    </div>
                  </div>
                )}

                {/* ==========================================
                    WIDGET 2: OPERATIONS CENTER (مرکز پیشرفته عملیات کارگاه چاپ)
                    ========================================== */}
                {activeSection === "operations" && (
                  <div>
                    <div className="step-title">
                      <span>دپارتمان تولید و فرآیندهای کارگاه</span>
                      <h3>مرکز هدایت عملیات و لجستیک کارگاه چاپ</h3>
                      <p>مانیتورینگ زنده ترافیک ماشین‌آلات، تخته فلو کانبان و زمان‌بندی پروژه‌ها بر پایه اصول مونو-داشبورد.</p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "24px" }}>
                      <button onClick={() => setOpsSubTab("kanban")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: opsSubTab === 'kanban' ? "2px solid var(--accent)" : "0", color: opsSubTab === 'kanban' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><List size={14} /> تخته جریان کانبان (Live Kanban)</button>
                      <button onClick={() => setOpsSubTab("gantt")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: opsSubTab === 'gantt' ? "2px solid var(--accent)" : "0", color: opsSubTab === 'gantt' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><Calendar size={14} /> زمان‌بندی گانت تولید (Gantt Planner)</button>
                      <button onClick={() => setOpsSubTab("capacity")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: opsSubTab === 'capacity' ? "2px solid var(--accent)" : "0", color: opsSubTab === 'capacity' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><Cpu size={14} /> ظرفیت ماشین‌ها و شیفت اپراتورها</button>
                    </div>

                    {opsSubTab === "kanban" && (
                      <div className="operations-kanban-board" style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px", alignItems: "flex-start" }}>
                        {kanbanColumns.map(col => {
                          const colJobs = jobs.filter(j => j.status === col.id);
                          return (
                            <div key={col.id} style={{ flex: "0 0 280px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", minHeight: "450px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--line)", paddingBottom: "8px" }}>
                                <strong style={{ fontSize: "13px" }}>{col.title}</strong>
                                <span style={{ background: "var(--surface-soft)", fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "10px" }}>{colJobs.length}</span>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {colJobs.map(job => (
                                  <motion.div layoutId={job.id} key={job.id} style={{ background: "var(--bg)", border: job.isVIP ? "2px solid #ef4444" : "1px solid var(--line)", borderRadius: "8px", padding: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", position: "relative", overflow: "hidden" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                      <strong style={{ fontSize: "12px", display: "block" }}>{job.product}</strong>
                                      <button onClick={() => toggleJobVIP(job.id)} style={{ background: "none", border: "0", cursor: "pointer", color: job.isVIP ? "#ef4444" : "var(--color-text-muted)" }} title="تغییر وضعیت اضطراری VIP"><Zap size={14} fill={job.isVIP ? "#ef4444" : "none"} /></button>
                                    </div>
                                    <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "var(--color-text-muted)" }}>مشتری: {job.customer} &bull; کد: {job.id}</p>
                                    
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed var(--line)", fontSize: "10px" }}>
                                      <span style={{ color: job.hoursRemaining <= 3 ? '#ef4444' : 'var(--color-text-muted)' }}>⏱️ {job.hoursRemaining} ساعت باقی‌مانده</span>
                                      <span style={{ fontWeight: "bold" }}>👤 {job.designer}</span>
                                    </div>

                                    <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                                      {col.id === 'review' && (
                                        <AppButton variant="primary" style={{ width: "100%", minHeight: "26px", fontSize: "10px", padding: "0" }} onClick={() => setActiveReviewJob(job)}>🔍 بررسی فنی فایل</AppButton>
                                      )}
                                      {col.id === 'qc' && (
                                        <AppButton variant="warning" style={{ width: "100%", minHeight: "26px", fontSize: "10px", padding: "0" }} onClick={() => setActiveQCJob(job)}>✅ چک‌لیست QC</AppButton>
                                      )}
                                      {col.id !== 'review' && col.id !== 'qc' && (
                                        <select onChange={(e) => moveJobStatus(job.id, e.target.value)} defaultValue={col.id} style={{ width: "100%", height: "24px", fontSize: "10px", background: "var(--surface)", border: "1px solid var(--line)", color: "var(--text)" }}>
                                          <option value="review">بررسی فایل</option>
                                          <option value="design">طراحی</option>
                                          <option value="printing">چاپخانه</option>
                                          <option value="qc">QC</option>
                                          <option value="packaging">بسته‌بندی</option>
                                          <option value="shipping">ارسال پستی</option>
                                        </select>
                                      )}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {opsSubTab === "gantt" && (
                      <AppCard variant="default">
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "bold" }}>برنامه‌ریزی زمانی کارهای فعال روی خط تولید (Gantt Chart)</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          {jobs.map(job => {
                            const startOffset = job.status === 'review' ? 5 : job.status === 'design' ? 25 : job.status === 'printing' ? 45 : 70;
                            const widthPercent = job.isVIP ? 30 : 20;
                            return (
                              <div key={job.id} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "20px", alignItems: "center", fontSize: "12px" }}>
                                <strong>{job.id} - {job.product}</strong>
                                <div style={{ height: "30px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: "4px", position: "relative" }}>
                                  <div style={{
                                    position: "absolute",
                                    right: `${startOffset}%`,
                                    width: `${widthPercent}%`,
                                    height: "100%",
                                    background: job.isVIP ? "linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)" : "linear-gradient(90deg, var(--accent) 0%, var(--accent-strong) 100%)",
                                    borderRadius: "3px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                    color: "var(--accent-ink)",
                                    boxShadow: job.isVIP ? "0 0 10px rgba(239,68,68,0.3)" : "none"
                                  }}>{job.customer}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AppCard>
                    )}

                    {opsSubTab === "capacity" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                        <AppCard variant="default">
                          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "bold" }}>کالیبراسیون و ظرفیت ساعتی ماشین‌آلات چاپ فیزیکی</h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {machines.map(m => (
                              <div key={m.id} style={{ borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", marginBottom: "6px" }}>
                                  <strong>{m.name}</strong>
                                  <span style={{ fontSize: "11px", background: "var(--surface-soft)", padding: "2px 8px", borderRadius: "4px" }}>وضعیت: {m.status.toUpperCase()}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                                  <span>ظرفیت مصرف شده چاپی:</span>
                                  <span>{m.usedHours} از {m.totalHours} ساعت</span>
                                </div>
                                <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                                  <div style={{ width: `${(m.usedHours/m.totalHours)*100}%`, height: "100%", background: m.usedHours >= 7 ? '#ef4444' : 'var(--accent)' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </AppCard>

                        <AppCard variant="default">
                          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "bold" }}>کارهای فعال طراحان ناظر (آتلیه)</h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {designers.map(d => (
                              <div key={d.name} style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "6px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px" }}>
                                  <span>{d.name}</span>
                                  <span style={{ color: "var(--accent)" }}>بازدهی: {d.efficiency}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-muted)", marginTop: "6px" }}>
                                  <span>کارهای فعال: {d.jobCount} کار</span>
                                  <span>میانگین زمان طراحی: {d.avgTime}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AppCard>
                      </div>
                    )}

                  </div>
                )}

                {/* ==========================================
                    WIDGET 3: CRM & CUSTOMER MANAGEMENT (CRM ۳۶۰ درجه)
                    ========================================== */}
                {activeSection === "crm" && (
                  <div>
                    <div className="step-title">
                      <span>دپارتمان مدیریت مشتریان (CRM)</span>
                      <h3>مرکز سنجش و هدایت ارتباط با مشتری (Customer 360°)</h3>
                      <p>رصد کامل سوابق پستی، تراکنش‌های درگاه، تیکت‌های باز و امتیاز اعتباری مشتریان حقیقی و حقوقی.</p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", margin: "24px 0" }}>
                      <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
                        {["all", "vip", "active", "inactive"].map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setCrmFilter(filter)}
                            style={{
                              padding: "6px 14px",
                              background: crmFilter === filter ? "var(--accent)" : "rgba(255,255,255,0.04)",
                              color: crmFilter === filter ? "var(--accent-ink)" : "var(--text)",
                              border: "1px solid var(--line)",
                              borderRadius: "30px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold"
                            }}
                          >
                            {filter === "all" ? "همه مخاطبین" : filter === "vip" ? "کاربران VIP" : filter === "active" ? "فعال و سالم" : "راکد / ریزشی"}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <input 
                          type="text" 
                          placeholder="جستجوی نام، تلفن، شرکت..." 
                          value={crmSearchQuery}
                          onChange={(e) => setCrmSearchQuery(e.target.value)}
                          style={{
                            height: "36px", padding: "0 12px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)", fontSize: "12px"
                          }}
                        />
                        <select 
                          value={crmSort}
                          onChange={(e) => setCrmSort(e.target.value)}
                          style={{
                            height: "36px", padding: "0 10px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "6px", color: "var(--text)", fontSize: "12px"
                          }}
                        >
                          <option value="newest">جدیدترین</option>
                          <option value="revenue">بیشترین وفاداری مالی (LTV)</option>
                          <option value="orders">بیشترین تعداد سفارش</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                      {filteredCustomers.map(customer => (
                        <AppCard 
                          key={customer.id} 
                          variant="interactive" 
                          onClick={() => {
                            setSelectedCRMUser(customer);
                            setCrmTab("overview");
                            setNoteInput(customerNotes[customer.code] || "");
                          }}
                          style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: "38px", height: "36px", background: "var(--surface-soft)", borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: "bold" }}>
                                {customer.name.charAt(0)}
                              </div>
                              <div>
                                <strong style={{ fontSize: "14px" }}>{customer.name}</strong>
                                <span style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{customer.company}</span>
                              </div>
                            </div>
                            {customer.isVIP && <span style={{ fontSize: "10px", background: "rgba(251,191,36,0.1)", color: "#fbbf24", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>🌟 VIP</span>}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", borderTop: "1px dashed var(--line)", paddingTop: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "var(--color-text-muted)" }}>مجموع خرید (LTV):</span>
                              <strong>{formatPrice(customer.ltv)} تومان</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "var(--color-text-muted)" }}>تعداد سفارشات:</span>
                              <strong>{customer.totalOrders} سفارش</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "var(--color-text-muted)" }}>وضعیت سلامت:</span>
                              <span style={{
                                color: customer.health === 'healthy' ? '#10b981' : customer.health === 'risk' ? '#f59e0b' : '#ef4444',
                                fontWeight: "bold"
                              }}>
                                {customer.health === 'healthy' ? 'سالم و فعال' : customer.health === 'risk' ? 'در خطر ریزش' : 'راکد / غیرفعال'}
                              </span>
                            </div>
                          </div>
                        </AppCard>
                      ))}
                    </div>

                  </div>
                )}

                {/* ==========================================
                    WIDGET 4: FINANCE & REPORTS (حسابداری و تحلیل سود و زیان)
                    ========================================== */}
                {activeSection === "reports" && (
                  <div>
                    <div className="step-title">
                      <span>دپارتمان مالی و حسابداری (ERP)</span>
                      <h3>پیشخوان حسابداری و تحلیل بهای تمام‌شده کارهای چاپی</h3>
                      <p>تحلیل دقیق درآمد ناخالص، هزینه‌های جاری کارگاه، درصد مرجوعی، سود خالص و کوپن‌های تخفیف پلتفرم.</p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "24px" }}>
                      <button onClick={() => setFinanceSubTab("accounting")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: financeSubTab === 'accounting' ? "2px solid var(--accent)" : "0", color: financeSubTab === 'accounting' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><BarChart size={14} /> خلاصه ترازنامه سود و زیان</button>
                      <button onClick={() => setFinanceSubTab("transactions")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: financeSubTab === 'transactions' ? "2px solid var(--accent)" : "0", color: financeSubTab === 'transactions' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><FileText size={14} /> دفتر ثبت تراکنش‌های درگاه</button>
                      <button onClick={() => setFinanceSubTab("coupons")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: financeSubTab === 'coupons' ? "2px solid var(--accent)" : "0", color: financeSubTab === 'coupons' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><PercentCircle size={14} /> موتور کوپن و تخفیف‌ها</button>
                    </div>

                    {financeSubTab === "accounting" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
                            <span style={{ fontSize: "20px", fontWeight: "bold", color: "var(--accent)" }}>۴۶,۹۰۰,۰۰۰ تومان</span>
                            <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "11px", marginTop: "4px" }}>💵 کل درآمد ناخالص (Revenue)</small>
                          </div>
                          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
                            <span style={{ fontSize: "20px", fontWeight: "bold", color: "#ef4444" }}>۱۲,۳۰۰,۰۰۰ تومان</span>
                            <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "11px", marginTop: "4px" }}>📉 کل هزینه‌های جاری کارگاه (Expenses)</small>
                          </div>
                          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
                            <span style={{ fontSize: "20px", fontWeight: "bold", color: "#10b981" }}>۳۴,۶۰۰,۰۰۰ تومان</span>
                            <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "11px", marginTop: "4px" }}>💰 سود خالص کارخانه (Real Profit)</small>
                          </div>
                        </div>

                        <AppCard variant="default">
                          <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "bold" }}>تحلیل بهای تمام‌شده و سود واقعی به ازای محصولات چاپی (Cost Engine):</h3>
                          <table style={{ width: "100%", textDirection: "right", textAlign: "right", fontSize: "13px", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ color: "var(--color-text-muted)", borderBottom: "1px solid var(--line)" }}>
                                <th style={{ padding: "10px 0" }}>نام محصول</th>
                                <th>تعرفه پایه فروش</th>
                                <th>هزینه ملزومات (کاغذ+مرکب)</th>
                                <th>سود ناخالص هر واحد</th>
                                <th>درصد حاشیه سود</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                                <td style={{ padding: "12px 0", fontWeight: "bold" }}>کارت ویزیت لمینت</td>
                                <td>۴,۲۰۰ تومان</td>
                                <td>۱,۵۰۰ تومان</td>
                                <td style={{ color: "#10b981", fontWeight: "bold" }}>۲,۷۰۰ تومان</td>
                                <td style={{ color: "#10b981" }}>۶۴٪ 📈</td>
                              </tr>
                              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                                <td style={{ padding: "12px 0", fontWeight: "bold" }}>کاتالوگ و بروشور</td>
                                <td>۱۶,۸۰۰ تومان</td>
                                <td>۵,۰۰۰ تومان</td>
                                <td style={{ color: "#10b981", fontWeight: "bold" }}>۱۱,۸۰۰ تومان</td>
                                <td style={{ color: "#10b981" }}>۷۰٪ 📈</td>
                              </tr>
                              <tr>
                                <td style={{ padding: "12px 0", fontWeight: "bold" }}>بسته‌بندی و جعبه لمینتی</td>
                                <td>۳۴,۵۰۰ تومان</td>
                                <td>۱۲,۰۰۰ تومان</td>
                                <td style={{ color: "#10b981", fontWeight: "bold" }}>۲۲,۵۰۰ تومان</td>
                                <td style={{ color: "#10b981" }}>۶۵٪ 📈</td>
                              </tr>
                            </tbody>
                          </table>
                        </AppCard>
                      </div>
                    )}

                    {financeSubTab === "transactions" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {transactions.map((tx) => (
                          <div key={tx.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "16px 20px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <strong style={{ fontSize: "14px" }}>کد تراکنش: {tx.refNo} ({tx.id})</strong>
                              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>بابت پیش‌فاکتور سفارش {tx.orderCode} &bull; مشتری: {tx.customer}</p>
                            </div>
                            <div style={{ textAlign: "left" }}>
                              <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "15px" }}>{formatPrice(tx.amount)} تومان</span>
                              <small style={{ display: "block", color: "#10b981", marginTop: "4px" }}>موفق (تایید شاپرک) 🟢</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {financeSubTab === "coupons" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px" }}>
                        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "24px", borderRadius: "10px" }}>
                          <span style={{ fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "16px" }}>تعریف کوپن تخفیف سازمانی جدید</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <AppInput label="کد اختصاصی کوپن *" placeholder="مثال: TAFT1405" />
                            <AppInput label="میزان تخفیف (درصد یا مبلغ ثابت به تومان) *" placeholder="مثال: ۱۵٪ یا ۵۰۰۰۰" />
                            <AppInput label="حداقل سبد خرید فعال‌سازی (تومان) *" placeholder="مثال: ۱۰۰۰۰۰۰" />
                            <AppButton variant="primary" onClick={() => alert("کوپن تخفیف با موفقیت در سیستم وفاداری مشتریان صادر شد.")}>صدور و فعال‌سازی کوپن</AppButton>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {coupons.map(cp => (
                            <div key={cp.code} style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "16px 20px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <strong style={{ fontSize: "14px", color: "var(--accent)" }}>{cp.code}</strong>
                                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>میزان تخفیف: {cp.discount} &bull; حداقل خرید: {formatPrice(cp.minAmount)} تومان</p>
                              </div>
                              <span className="status-badge pending" style={{ background: "#dcfce7", color: "#15803d", fontSize: "11px" }}>{cp.usedCount} از {cp.maxUsages} مصرف شده</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* ==========================================
                    WIDGET 5: SETTINGS & AUTOMATION ENGINE (تنظیمات، منابع و اتوماسیون)
                    ========================================== */}
                {activeSection === "settings" && (
                  <div>
                    <div className="step-title">
                      <span>دپارتمان فناوری و اتوماسیون</span>
                      <h3>مرکز کنترل پویای قوانین اتوماسیون و مدیریت منابع</h3>
                      <p>تعریف فرمول‌های پویا، جریان‌های کاری منعطف، ایجاد آدرس‌های ارسال و قوانین اتوماسیون بدون یک خط کدنویسی.</p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "24px" }}>
                      <button onClick={() => setSettingsSubTab("automation")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: settingsSubTab === 'automation' ? "2px solid var(--accent)" : "0", color: settingsSubTab === 'automation' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><Zap size={14} /> قوانین اتوماسیون</button>
                      <button onClick={() => setSettingsSubTab("resources")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: settingsSubTab === 'resources' ? "2px solid var(--accent)" : "0", color: settingsSubTab === 'resources' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><Cpu size={14} /> مدیریت منابع کارگاه (Resources)</button>
                      <button onClick={() => setSettingsSubTab("wizard_builder")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: settingsSubTab === 'wizard_builder' ? "2px solid var(--accent)" : "0", color: settingsSubTab === 'wizard_builder' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><Sparkles size={14} /> طراح گرافیکی ویزارد (Form Engine)</button>
                    </div>

                    {/* الف) قوانین و لاگ اتوماسیون */}
                    {settingsSubTab === "automation" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                          <span style={{ fontWeight: "bold", fontSize: "14px", display: "block" }}>قوانین اتوماسیون فعال کارگاه (Rule Builder):</span>
                          {automationRules.map(rule => (
                            <AppCard key={rule.id} variant="default" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <strong style={{ fontSize: "13px", color: "var(--accent)" }}>{rule.title}</strong>
                                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>رویداد راه‌انداز: {rule.trigger} &bull; اقدام خودکار: {rule.action}</p>
                              </div>
                              <label className="settings-toggle">
                                <input type="checkbox" checked={rule.is_active} onChange={() => {
                                  const updated = automationRules.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r);
                                  setAutomationRules(updated);
                                }} />
                                <span />
                              </label>
                            </AppCard>
                          ))}
                        </div>

                        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "10px", padding: "20px" }}>
                          <span style={{ fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "16px" }}>لاگ‌های زنده اجرای اتوماسیون (Automation Logs):</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {automationLogs.map(log => (
                              <div key={log.id} style={{ borderBottom: "1px solid var(--line)", paddingBottom: "10px", fontSize: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                                  <span>{log.ruleTitle}</span>
                                  <span style={{ color: log.status === 'executed' ? '#10b981' : '#f59e0b' }}>{log.status.toUpperCase()}</span>
                                </div>
                                <p style={{ margin: "4px 0 0 0", color: "var(--color-text-muted)", fontSize: "11px" }}>{log.detail}</p>
                                <span style={{ display: "block", textAlign: "left", fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>{log.time}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* ==========================================
                    WIDGET 6: CMS & CONTENT MANAGEMENT (مدیریت محتوا و وبلاگ)
                    ========================================== */}
                {activeSection === "cms" && (
                  <div>
                    <div className="step-title">
                      <span>دپارتمان بازاریابی و مدیریت محتوا</span>
                      <h3>مرکز هدایت محتوا، وبلاگ، صفحات ایستا و کتابخانه رسانه</h3>
                      <p>انتشار مقالات تخصصی، مدیریت سئو صفحات لندینگ و سازمان‌دهی اسناد و تصاویر کتابخانه چندرسانه‌ای.</p>
                    </div>

                    {/* منوی زیر‌آدرس CMS */}
                    <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "24px" }}>
                      <button onClick={() => setCmsSubTab("posts")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: cmsSubTab === 'posts' ? "2px solid var(--accent)" : "0", color: cmsSubTab === 'posts' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><FileText size={14} /> مقالات وبلاگ (Posts)</button>
                      <button onClick={() => setCmsSubTab("pages")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: cmsSubTab === 'pages' ? "2px solid var(--accent)" : "0", color: cmsSubTab === 'pages' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><Layers size={14} /> صفحات ایستا و لندینگ‌ها (Pages)</button>
                      <button onClick={() => setCmsSubTab("media")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: cmsSubTab === 'media' ? "2px solid var(--accent)" : "0", color: cmsSubTab === 'media' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><Upload size={14} /> کتابخانه چندرسانه‌ای (Media Library)</button>
                      <button onClick={() => setCmsSubTab("faq")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0", borderBottom: cmsSubTab === 'faq' ? "2px solid var(--accent)" : "0", color: cmsSubTab === 'faq' ? "var(--accent)" : "var(--text)", padding: "8px 16px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}><HelpCircle size={14} /> سوالات متداول (FAQ)</button>
                    </div>

                    {/* الف) مدیریت مقالات وبلاگ */}
                    {cmsSubTab === "posts" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "14px" }}>مقالات منتشر شده و پیش‌نویس وبلاگ:</strong>
                          <AppButton variant="primary" icon={<Plus size={14} />} onClick={() => alert("فرم ایجاد پست جدید وبلاگ باز شد.")}>ایجاد مقاله جدید وبلاگ</AppButton>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {[
                            { id: 1, title: "راهنمای جامع کالیبره کردن رنگ‌های چاپ افست", category: "آموزش چاپ", status: "published", views: 245, author: "سارا احمدی" },
                            { id: 2, title: "چرا کاغذ کتان برای کارت ویزیت‌های مدیریتی مناسب‌تر است؟", category: "معرفی متریال", status: "published", views: 189, author: "مهندس علوی" },
                            { id: 3, title: "اصول طراحی جعبه و بسته‌بندی برای محصولات آرایشی", category: "بسته‌بندی", status: "draft", views: 0, author: "محمد حیدری" }
                          ].map(post => (
                            <div key={post.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "16px 20px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <strong style={{ fontSize: "14px" }}>{post.title}</strong>
                                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>دسته‌بندی: {post.category} &bull; نویسنده: {post.author}</p>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>👁️ {post.views} بازدید</span>
                                <span className={`status-badge pending`} style={{ fontSize: "11px", background: post.status === 'published' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: post.status === 'published' ? '#10b981' : '#f59e0b' }}>{post.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}</span>
                                <button className="reorder-action-button" onClick={() => alert("ویرایش سئو مقاله فعال شد.")}><Edit size={13} /> ویرایش سئو</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ب) مدیریت صفحات ایستا و لندینگ‌ها */}
                    {cmsSubTab === "pages" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[
                          { title: "درباره ما (About Us)", slug: "about-us", type: "static", version: "v1.2", status: "published" },
                          { title: "قوانین و مقررات سفارش آنلاین (Terms)", slug: "terms", type: "static", version: "v2.0", status: "published" },
                          { title: "کمپین تخفیف ویژه چاپ بهاره (Landing)", slug: "spring-campaign", type: "landing", version: "v1.0", status: "draft" }
                        ].map(page => (
                          <div key={page.slug} style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "16px 20px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <strong style={{ fontSize: "14px" }}>{page.title}</strong>
                              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>آدرس متنی (Slug): /pages/{page.slug} &bull; نسخه: {page.version}</p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                              <span className="status-badge pending" style={{ fontSize: "10px" }}>{page.type === 'static' ? 'ایستای عمومی' : 'صفحه فرود تبلیغاتی'}</span>
                              <span className="status-badge pending" style={{ background: page.status === 'published' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: page.status === 'published' ? '#10b981' : '#f59e0b', fontSize: "10px" }}>{page.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}</span>
                              <button className="reorder-action-button" onClick={() => alert("مشاهده هیستوری تغییرات نسخه...")}><History size={13} /> نسخه قدیمی</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ج) کتابخانه چندرسانه‌ای (Media Library) */}
                    {cmsSubTab === "media" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "14px" }}>فایل‌های آپلود شده کارگاه و مقالات:</strong>
                          <AppButton variant="primary" icon={<Upload size={14} />} onClick={() => alert("فایل جدیدی برای آپلود انتخاب کنید.")}>آپلود فایل جدید</AppButton>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                          {[
                            { name: "hero-print-cover.jpg", size: "1.2 MB", type: "IMAGE" },
                            { name: "bleed-safe-zone-guide.pdf", size: "4.5 MB", type: "PDF" },
                            { name: "konica-printing-demo.mp4", size: "24.1 MB", type: "VIDEO" },
                            { name: "invoice-official-template.xlsx", size: "145 KB", type: "DOCUMENT" }
                          ].map(file => (
                            <AppCard key={file.name} variant="default" style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "center" }}>
                              <div style={{ height: "80px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "6px", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: "16px", color: "rgba(255,255,255,0.06)" }}>
                                {file.type}
                              </div>
                              <strong style={{ fontSize: "12px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{file.name}</strong>
                              <small style={{ color: "var(--color-text-muted)" }}>حجم: {file.size}</small>
                            </AppCard>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* د) سوالات متداول (FAQ Engine) */}
                    {cmsSubTab === "faq" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <strong style={{ fontSize: "14px" }}>سوالات متداول مشتریان (FAQ):</strong>
                          <AppButton variant="primary" icon={<Plus size={14} />} onClick={() => alert("درخواست ایجاد سوال جدید ثبت شد.")}>ایجاد سوال متداول جدید</AppButton>
                        </div>

                        {[
                          { id: 1, q: "حداقل تیراژ کارت ویزیت چقدر است؟", a: "حداقل تیراژ برای کارهای فرم عمومی ۱۰۰ عدد می‌باشد.", order: 1 },
                          { id: 2, q: "چقدر زمان می‌برد تا سفارش چاپ من آماده شود؟", a: "زمان تقریبی تحویل برای کارت ویزیت ۳ روز و برای بسته‌بندی ۱۰ روز کاری است.", order: 2 }
                        ].map(faq => (
                          <div key={faq.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "16px 20px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <strong style={{ fontSize: "13px", color: "var(--accent)" }}>{faq.q}</strong>
                              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--color-text-muted)", lineHeight: "1.7" }}>{faq.a}</p>
                            </div>
                            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>ترتیب: {faq.order}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}

                {activeSection === "orders" && (
                  <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "40px", borderRadius: "12px", textAlign: "center" }}>
                    <Printer size={48} style={{ color: "var(--accent)", marginBottom: "16px", marginInline: "auto" }} />
                    <h3 style={{ fontSize: "18px", fontWeight: "bold" }}>سامانه مدیریت سفارشات چاپی (Order Management)</h3>
                    <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "8px" }}>پیشرفته‌ترین ماژول کنترل فاکتورها، تفکیک کارهای چاپی و صدور حواله کارگاهی چاپی در دستان شماست.</p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

          </main>
        </div>
      </div>

      {/* ==========================================
          ۳. راست‌پنل داینامیک و متنی (Dynamic Right Panel)
          ========================================== */}
      {rightPanelExpanded && (
        <aside className="profile-sidebar" style={{
          width: "320px",
          background: "var(--surface)",
          borderRight: "1px solid var(--line)",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          position: "sticky",
          top: "0",
          height: "100vh",
          zIndex: "95"
        }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "bold" }}>فرماندهی زنده کارگاه</h3>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>گزارش لحظه‌ای رویدادهای مانیتورینگ</span>
          </div>

          <div style={{ background: "var(--surface-soft)", padding: "14px", borderRadius: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--accent)" }}>
              {activeSection === "dashboard" ? "📊 خلاصه عملکرد امروز" : activeSection === "operations" ? "🖨️ مانیتور کارگاه" : "⚙️ بخش سیستمی"}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>کل سفارشات امروز:</span><strong>۱۲ عدد</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>کارهای ورودی آتلیه:</span><strong>۵ فایل</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>ضریب دورو رنگی پویا:</span><strong>۱.۱۶x</strong></div>
            </div>
          </div>

          <div>
            <strong style={{ display: "block", fontSize: "13px", marginBottom: "12px" }}>🕒 لاگ مانیتورینگ تغییرات (Audit Log):</strong>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {activities.map(act => (
                <div key={act.id} style={{ fontSize: "11px", borderBottom: "1px solid var(--line)", paddingBottom: "10px" }}>
                  <span style={{ display: "block", fontWeight: "bold", color: act.type === 'payment' ? '#10b981' : 'var(--text)' }}>{act.text}</span>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)", marginTop: "4px" }}>
                    <span>توسط: {act.user}</span>
                    <span>{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}

      {/* ==========================================
          ۴. مودال کامند پلت (Command Palette - Ctrl + K)
          ========================================== */}
      <AppModal isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} title="صفحه دستورات ادمین (Command Palette)">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <AppInput 
            autoFocus
            icon={<Search size={16} />}
            placeholder="مثلاً بنویسید: ایجاد محصول جدید، مشاهده سفارشات، تنظیمات..." 
            value={commandQuery}
            onChange={(e) => setCommandQuery(e.target.value)}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: "bold" }}>دستورات متداول:</span>
            
            <button 
              onClick={() => { setActiveSection("operations"); setIsCommandPaletteOpen(false); }}
              style={{ padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: "6px", cursor: "pointer", color: "var(--text)", textDirection: "right", textAlign: "right", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>🖨️ رفتن به مرکز مدیریت کارگاه چاپی (Operations Center)</span>
              <span style={{ fontSize: "11px", opacity: "0.6" }}>G + O</span>
            </button>
            <button 
              onClick={() => { alert("فرم تعریف محصول جدید چاپی باز شد."); setIsCommandPaletteOpen(false); }}
              style={{ padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: "6px", cursor: "pointer", color: "var(--text)", textDirection: "right", textAlign: "right", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>📦 ایجاد و تعریف تعرفه محصول جدید چاپی</span>
              <span style={{ fontSize: "11px", opacity: "0.6" }}>N</span>
            </button>
            <button 
              onClick={() => { setActiveSection("reports"); setIsCommandPaletteOpen(false); }}
              style={{ padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: "6px", cursor: "pointer", color: "var(--text)", textDirection: "right", textAlign: "right", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>📊 مشاهده دفتر کل حسابداری سود و زیان کارگاه</span>
              <span style={{ fontSize: "11px", opacity: "0.6" }}>G + C</span>
            </button>
          </div>
        </div>
      </AppModal>

      {/* ==========================================
          ۵. مودال بررسی فنی فایل (Pre-Flight Checklist)
          ========================================== */}
      <AppModal isOpen={activeReviewJob !== null} onClose={() => setActiveReviewJob(null)} title="🔍 فرم بررسی و ناظر فنی فایل چاپی مشتری">
        {activeReviewJob && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>بررسی فایل طرح برای کار #{activeReviewJob.id} ({activeReviewJob.product})</span>
            
            <div style={{ background: "var(--surface-soft)", padding: "14px", borderRadius: "8px", fontSize: "12px" }}>
              <strong>چک‌لیست کالیبراسیون ناظر چاپخانه (Pre-flight Checklist):</strong>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={fileChecklist.resolution} onChange={(e) => setFileChecklist({ ...fileChecklist, resolution: e.target.checked })} />
                  <span>کیفیت تصویر ۳۰۰ DPI واقعی</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={fileChecklist.bleed} onChange={(e) => setFileChecklist({ ...fileChecklist, bleed: e.target.checked })} />
                  <span>رعایت حاشیه امن برش ۳ میلی‌متر</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={fileChecklist.colorMode} onChange={(e) => setFileChecklist({ ...fileChecklist, colorMode: e.target.checked })} />
                  <span>رنگ‌بندی CMYK چاپی</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={fileChecklist.fonts} onChange={(e) => setFileChecklist({ ...fileChecklist, fonts: e.target.checked })} />
                  <span>کانورت شدن فونت‌ها به شیپ</span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <AppButton variant="success" onClick={() => {
                moveJobStatus(activeReviewJob.id, "design");
                setActiveReviewJob(null);
                alert("طرح تایید فنی شد و به آتلیه طراحی ارجاع گردید.");
              }}>تایید طرح و ارسال به آتلیه</AppButton>
              <AppButton variant="danger" onClick={() => {
                alert("طرح به دلیل عدم رعایت خط برش رد شد و نوتیفیکیشن رفع خطا برای مشتری صادر شد.");
                setActiveReviewJob(null);
              }}>رد طرح (ارسال درخواست اصلاح به مشتری)</AppButton>
            </div>
          </div>
        )}
      </AppModal>

      {/* ==========================================
          ۶. مودال بررسی کنترل کیفیت (QC Checklist)
          ========================================== */}
      <AppModal isOpen={activeQCJob !== null} onClose={() => setActiveQCJob(null)} title="✅ فرم تایید نهایی کنترل کیفیت کارگاه (Quality Control)">
        {activeQCJob && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>چک‌لیست ممیزی QC برای کار #{activeQCJob.id}</span>

            <div style={{ background: "var(--surface-soft)", padding: "14px", borderRadius: "8px", fontSize: "12px" }}>
              <strong>شاخص‌های کنترل کیفیت:</strong>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={qcChecklist.colors} onChange={(e) => setQcChecklist({ ...qcChecklist, colors: e.target.checked })} />
                  <span>تطابق رنگ زینک با طرح مانیتور</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={qcChecklist.cut} onChange={(e) => setQcChecklist({ ...qcChecklist, cut: e.target.checked })} />
                  <span>دقت بالای برش و گونیا بودن لبه‌ها</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={qcChecklist.paper} onChange={(e) => setQcChecklist({ ...qcChecklist, paper: e.target.checked })} />
                  <span>سالم بودن گرماژ و عدم وجود چروک کاغذ</span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <AppButton variant="success" onClick={() => {
                moveJobStatus(activeQCJob.id, "packaging");
                setActiveQCJob(null);
                alert("کار ممیزی کیفی شد و به بخش بسته‌بندی انتقال یافت.");
              }}>پاس شدن QC (ارسال به بسته‌بندی)</AppButton>
              <AppButton variant="danger" onClick={() => {
                alert("کار رد صلاحیت کیفی شد و جهت بازچاپ مجدد به اول صف چاپخانه ارجاع شد.");
                moveJobStatus(activeQCJob.id, "printing");
                setActiveQCJob(null);
              }}>رد صلاحیت (ارجاع مجدد به کارگاه چاپ)</AppButton>
            </div>
          </div>
        )}
      </AppModal>

      {/* ==========================================
          ۷. مودال پرونده ۳۶۰ درجه مشتری و CRM (Customer 360° Profile Sheet)
          ========================================== */}
      <AppModal isOpen={selectedCRMUser !== null} onClose={() => setSelectedCRMUser(null)} size="lg" title="👤 پرونده متمرکز ۳۶۰ درجه مشتری (CRM Center)">
        {selectedCRMUser && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "52px", height: "50px", background: "var(--accent)", color: "var(--accent-ink)", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "20px", fontWeight: "bold" }}>
                  {selectedCRMUser.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>{selectedCRMUser.name} <span style={{ fontSize: "11px", background: "var(--surface-soft)", padding: "2px 8px", borderRadius: "4px" }}>{selectedCRMUser.code}</span></h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>شرکت: {selectedCRMUser.company} &bull; عضویت از {selectedCRMUser.registeredAt}</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {selectedCRMUser.isVIP && <AppBadge status="paid" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid #fbbf24" }} />}
                <span className={`status-badge pending`}>
                  {selectedCRMUser.health === 'healthy' ? "فعال و سالم" : "در خطر ریزش"}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
              <div style={{ background: "var(--surface-soft)", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: "bold" }}>{selectedCRMUser.totalOrders}</span>
                <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "10px", marginTop: "2px" }}>تعداد کل سفارشات</small>
              </div>
              <div style={{ background: "var(--surface-soft)", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: "bold", color: "var(--accent)" }}>{formatPrice(selectedCRMUser.ltv)} تومان</span>
                <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "10px", marginTop: "2px" }}>کل وفاداری مالی (LTV)</small>
              </div>
              <div style={{ background: "var(--surface-soft)", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: "bold", color: "#fbbf24" }}>{selectedCRMUser.score} / ۱۰۰</span>
                <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "10px", marginTop: "2px" }}>امتیاز اعتباری</small>
              </div>
              <div style={{ background: "var(--surface-soft)", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: "bold" }}>{formatPrice(selectedCRMUser.creditLimit)} تومان</span>
                <small style={{ display: "block", color: "var(--color-text-muted)", fontSize: "10px", marginTop: "2px" }}>سقف اعتبار B2B</small>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--line)", paddingBottom: "10px", margin: "10px 0" }}>
              {["overview", "notes", "b2b", "discounts"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCrmTab(tab as any)}
                  style={{
                    background: "none",
                    border: "0",
                    borderBottom: crmTab === tab ? "2px solid var(--accent)" : "0",
                    color: crmTab === tab ? "var(--accent)" : "var(--text)",
                    padding: "6px 12px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  {tab === 'overview' ? "بررسی اجمالی" : tab === 'notes' ? "یادداشت ادمین" : tab === 'b2b' ? "حساب B2B" : "پروفایل تخفیف"}
                </button>
              ))}
            </div>

            <div style={{ minHeight: "150px" }}>
              
              {crmTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ background: "rgba(56, 189, 248, 0.05)", border: "1px dashed rgba(56, 189, 248, 0.3)", padding: "14px", borderRadius: "8px", fontSize: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
                    <Sparkles size={20} style={{ color: "#38bdf8", flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: "#38bdf8", display: "block", marginBottom: "4px" }}>🧠 پیشنهاد هوشمند مرکز تحلیل رفتار مشتری (Intelligence):</strong>
                      {selectedCRMUser.totalOrders > 10 ? (
                        <span>این کاربر از باارزش‌ترین مشتریان چاپخانه است. سیستم پیشنهاد می‌دهد برای حفظ وفاداری، کد تخفیف اختصاصی مناسب چاپ کاتالوگ پاییزی برای ایشان اس‌ام‌اس شود.</span>
                      ) : (
                        <span>مشتری در محدوده انفعال قرار دارد. سیستم پیشنهاد می‌دهد یک کمپین Win-Back با تخفیف ۱۵ درصدی سلفون مات برای ایشان ارسال شود.</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "12px" }}>
                    <div>
                      <span style={{ color: "var(--color-text-muted)" }}>پست الکترونیکی:</span>
                      <p style={{ margin: "4px 0 0 0", fontWeight: "bold" }}>{selectedCRMUser.email}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--color-text-muted)" }}>شماره تلفن مستقیم:</span>
                      <p style={{ margin: "4px 0 0 0", fontWeight: "bold" }}>{selectedCRMUser.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {crmTab === "notes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block" }}>یادداشت‌های مخفی ثبت‌شده توسط کارشناسان فروش (این پیام‌ها برای مشتری هرگز نمایش داده نمی‌شوند):</span>
                  
                  <div style={{ background: "rgba(245, 158, 11, 0.05)", borderRight: "3px solid #f59e0b", padding: "12px", borderRadius: "4px", fontSize: "12px", lineHeight: "1.6", fontStyle: "italic" }}>
                    {customerNotes[selectedCRMUser.code] || "هیچ یادداشتی برای این مشتری ثبت نشده است."}
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <AppInput 
                      placeholder="یادداشت جدیدی اضافه کنید..." 
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                    />
                    <AppButton variant="primary" style={{ minHeight: "44px", alignSelf: "flex-end" }} onClick={() => {
                      setCustomerNotes({
                        ...customerNotes,
                        [selectedCRMUser.code]: noteInput
                      });
                      alert("یادداشت با موفقیت در پرونده مشتری ذخیره شد.");
                    }}>ذخیره یادداشت</AppButton>
                  </div>
                </div>
              )}

              {crmTab === "b2b" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div style={{ background: "var(--surface-soft)", padding: "12px", borderRadius: "6px" }}>
                      <span>سقف اعتبار معامله سازمانی (B2B):</span>
                      <strong style={{ display: "block", fontSize: "15px", color: "var(--accent)", marginTop: "6px" }}>{formatPrice(selectedCRMUser.creditLimit)} تومان</strong>
                    </div>
                    <div style={{ background: "var(--surface-soft)", padding: "12px", borderRadius: "6px" }}>
                      <span>مهلت تسویه فاکتور چاپی:</span>
                      <strong style={{ display: "block", fontSize: "15px", color: "var(--text)", marginTop: "6px" }}>۳۰ روزه</strong>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                    <strong style={{ display: "block", fontSize: "13px", marginBottom: "8px" }}>👥 کارمندان رابط و مخاطبین این شرکت (B2B Contacts):</strong>
                    <table style={{ width: "100%", textDirection: "right", textAlign: "right", fontSize: "12px", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ color: "var(--color-text-muted)", borderBottom: "1px solid var(--line)" }}>
                          <th style={{ padding: "8px 0" }}>نام مخاطب</th>
                          <th>سمت رسمی</th>
                          <th>شماره تماس</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "8px 0" }}>محسن کریمی</td>
                          <td>مدیر بازرگانی و خرید</td>
                          <td>09129999999</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "8px 0" }}>رضا حیدری</td>
                          <td>سرپرست آتلیه طراحی گرافیک</td>
                          <td>09128888888</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {crmTab === "discounts" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "12px" }}>
                  <div style={{ background: "var(--surface-soft)", padding: "12px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>تخفیف ثابت سفارشات:</span>
                    <strong style={{ color: "var(--accent)", fontSize: "14px" }}>۵٪ تخفیف کل فاکتور</strong>
                  </div>
                  <div style={{ background: "var(--surface-soft)", padding: "12px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>تخفیف فصلی (کمپین یلدا):</span>
                    <strong style={{ color: "var(--accent)", fontSize: "14px" }}>۱۰٪ تخفیف روی سلفون مات</strong>
                  </div>
                </div>
              )}

            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <AppButton variant="outline" onClick={() => setSelectedCRMUser(null)}>بستن پرونده</AppButton>
              <AppButton variant="primary" onClick={() => alert("دریافت فایل اکسل ۳۶۰ درجه مشتری")}>خروجی کامل اطلاعات اکسل</AppButton>
            </div>

          </div>
        )}
      </AppModal>

      {/* ==========================================
          Modals for Phase 7 Part 2: JSON Export / Import Modal
          ========================================== */}
      <AppModal isOpen={isNewWizardModalOpen} onClose={() => setIsNewWizardModalOpen(false)} title="📦 خروجی کدهای ساختار یافته JSON ویزارد">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>کد زیر ساختار پویای ویزارد فعلی شماست که کاملاً مستقل از کدنویسی فرانت‌اند بوده و آماده ایمپورت در سایر پلتفرم‌ها می‌باشد:</span>
          <textarea 
            readOnly
            value={wizardJSONOutput}
            style={{
              width: "100%",
              height: "250px",
              fontFamily: "monospace",
              fontSize: "11px",
              padding: "12px",
              background: "var(--bg)",
              border: "1px solid var(--line)",
              color: "var(--text)",
              borderRadius: "6px",
              resize: "none"
            }}
          />
          <AppButton variant="primary" onClick={() => {
            navigator.clipboard.writeText(wizardJSONOutput);
            alert("کدهای JSON ساختاری ویزارد در حافظه کپی شدند!");
          }}>کپی کدهای ساختاری JSON</AppButton>
        </div>
      </AppModal>

    </div>
  );
}

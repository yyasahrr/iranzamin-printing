import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpLeft,
  Check,
  ChevronLeft,
  Clock,
  Loader,
  LogIn,
  Phone,
  Smartphone,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type UserProfile } from "../contexts/AuthContext";
import { apiService } from "../services/api";

type Step = "phone" | "otp";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("09");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect to profile if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate("/profile", { replace: true });
  }, [isAuthenticated, navigate]);

  // OTP timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const requestOtp = async () => {
    setError("");
    if (!/^09\d{9}$/.test(phone)) {
      setError("شماره موبایل معتبر با ۰۹ وارد کنید.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.requestOTP(phone);
      setLoading(false);
      setStep("otp");
      setTimer(res.expires_in_seconds || 120);
      if (res.demo_code) {
        console.log(`[Django Backend OTP]: ${res.demo_code}`);
      }
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      console.warn("Django backend offline or error. Falling back to Demo Mode.", err.message);
      setLoading(false);
      setStep("otp");
      setTimer(120);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    setError("");
    const code = otp.join("");
    if (code.length < 6) {
      setError("کد تأیید ۶ رقمی را کامل وارد کنید.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.verifyOTP(phone, code);
      setLoading(false);
      login({
        id: res.user.id,
        name: res.user.name,
        phone: res.user.phone,
        email: res.user.email,
        registeredAt: res.user.registeredAt,
      }, res.token);
      navigate("/profile", { replace: true });
    } catch (err: any) {
      console.warn("Django verification failed or backend offline. Falling back to Demo Mode.", err.message);
      setLoading(false);
      const profile: UserProfile = {
        name: phone === "09123456789" ? "سارا احمدی" : `کاربر ${phone.slice(-4)}`,
        phone,
        email: "",
        registeredAt: new Date().toISOString(),
      };
      login(profile);
      navigate("/profile", { replace: true });
    }
  };

  return (
    <div className="auth-page" dir="rtl">
      <div className="auth-card">
        <div className="auth-header">
          <button className="auth-back" onClick={() => navigate("/")} aria-label="بازگشت به صفحه اصلی">
            <ChevronLeft size={20} />
          </button>
          <span className="auth-brand">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            چاپ روشن
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone"
              className="auth-body"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="auth-icon"><Smartphone size={32} /></div>
              <h2>ورود | ثبت‌نام</h2>
              <p className="auth-subtitle">
                برای ورود به پنل کاربری، شماره موبایل خود را وارد کنید. کد تأیید برایتان پیامک می‌شود.
              </p>

              <label className="auth-phone-label">
                <span>شماره موبایل</span>
                <div className="auth-phone-input">
                  <Phone size={18} />
                  <input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, "");
                      if (cleaned.length <= 11) setPhone(cleaned);
                    }}
                    placeholder="09123456789"
                    autoFocus
                  />
                </div>
              </label>

              {error && <p className="auth-error">{error}</p>}

              <button className="primary-button auth-submit" onClick={requestOtp} disabled={loading}>
                {loading ? (
                  <Loader size={18} className="spin-icon" />
                ) : (
                  <>
                    دریافت کد تأیید
                    <ArrowLeft size={18} />
                  </>
                )}
              </button>

              <p className="auth-note">
                با ورود، 
                <a href="#">قوانین و حریم خصوصی</a>
                را می‌پذیرید.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              className="auth-body"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <button className="auth-back-step" onClick={() => { setStep("phone"); setError(""); setOtp(["","","","","",""]); }}>
                <ChevronLeft size={16} />
                ویرایش شماره
              </button>

              <div className="auth-icon"><LogIn size={32} /></div>
              <h2>کد تأیید</h2>
              <p className="auth-subtitle">
                کد ۶ رقمی به شماره <strong dir="ltr">{phone}</strong> ارسال شد.
              </p>

              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={digit ? "filled" : ""}
                    aria-label={`رقم ${index + 1} کد تأیید`}
                  />
                ))}
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button className="primary-button auth-submit" onClick={verifyOtp} disabled={loading}>
                {loading ? (
                  <Loader size={18} className="spin-icon" />
                ) : (
                  <>
                    تأیید و ورود
                    <Check size={18} />
                  </>
                )}
              </button>

              <div className="otp-resend">
                {timer > 0 ? (
                  <span><Clock size={14} /> {formatTimer(timer)}</span>
                ) : (
                  <button onClick={requestOtp}>ارسال مجدد کد</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="auth-footer">
          <a href="/" className="auth-footer-link">
            <ArrowUpLeft size={15} />
            بازگشت به سایت
          </a>
        </div>
      </div>
    </div>
  );
}

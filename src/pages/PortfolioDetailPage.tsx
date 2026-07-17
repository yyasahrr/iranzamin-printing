import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Moon,
  Phone,
  Quote,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPortfolioBySlug } from "../data/portfolio";

type Theme = "dark" | "light";

export default function PortfolioDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const work = getPortfolioBySlug(slug ?? "");
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("chap-roshan-theme") as Theme) ?? "dark";
  });
  const [scrolled, setScrolled] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("chap-roshan-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!work) {
    return (
      <div className="detail-page" dir="rtl">
        <div className="detail-error">
          <h2>پروژه مورد نظر یافت نشد.</h2>
          <Link to="/" className="primary-button">
            <ArrowLeft size={18} />
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page" dir="rtl">
      <header className={`detail-header ${scrolled ? "detail-header-scrolled" : ""}`}>
        <div className="detail-header-inner">
          <button className="detail-back" onClick={() => navigate(-1)} aria-label="بازگشت">
            <ChevronLeft size={20} />
          </button>
          <Link to="/" className="detail-brand">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span>چاپ روشن</span>
          </Link>
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
        </div>
      </header>

      <main className="detail-main">
        {/* Gallery */}
        <section className="detail-gallery">
          <AnimatePresence mode="wait">
            <motion.img
              key={galleryIndex}
              src={work.gallery[galleryIndex] ?? work.image}
              alt={work.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
          {work.gallery.length > 1 && (
            <div className="detail-gallery-nav">
              <button
                onClick={() => setGalleryIndex((i) => (i === 0 ? work.gallery.length - 1 : i - 1))}
                aria-label="تصویر قبلی"
              >
                <ChevronRight size={20} />
              </button>
              <span>{galleryIndex + 1} / {work.gallery.length}</span>
              <button
                onClick={() => setGalleryIndex((i) => (i === work.gallery.length - 1 ? 0 : i + 1))}
                aria-label="تصویر بعدی"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
          )}
        </section>

        {/* Title & meta */}
        <div className="detail-meta page-width">
          <div className="detail-meta-head">
            <div>
              <p className="eyebrow">{work.category}</p>
              <h1>{work.title}</h1>
            </div>
            <Link to="/#portfolio" className="text-button">
              <ArrowUpLeft size={17} />
              همه نمونه‌کارها
            </Link>
          </div>
          <div className="detail-meta-row">
            <span><User size={15} /> {work.client}</span>
            <span><CalendarDays size={15} /> {work.year}</span>
          </div>
          <p className="detail-desc">{work.fullDescription}</p>
        </div>

        {/* Specs */}
        <section className="detail-specs page-width">
          <div className="detail-specs-grid">
            {work.specs.map((spec) => (
              <div key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="detail-services">
          <div className="page-width">
            <h2>خدمات انجام شده</h2>
            <div className="detail-services-list">
              {work.services.map((service) => (
                <span key={service}>
                  <Check size={14} />
                  {service}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        {work.testimonial && (
          <section className="detail-testimonial page-width">
            <div className="testimonial-card">
              <Quote size={28} />
              <p>{work.testimonial.text}</p>
              <div>
                <strong>{work.testimonial.author}</strong>
                <small>{work.testimonial.role}</small>
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="detail-cta">
          <div className="page-width">
            <h2>برای پروژه خودت هم همین کیفیت رو می‌خوای؟</h2>
            <p>با ما در ارتباط باش تا چاپ دقیق و حرفه‌ای رو تجربه کنی.</p>
            <div className="detail-cta-actions">
              <button className="primary-button" onClick={() => navigate("/#order")}>
                ثبت سفارش
                <ArrowLeft size={18} />
              </button>
              <a href="tel:+982188745210" className="detail-phone">
                <Phone size={18} />
                ۰۲۱ ۸۸۷۴ ۵۲۱۰
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="detail-footer">
        <div className="page-width detail-footer-inner">
          <Link to="/#portfolio" className="detail-footer-link">
            <ArrowUpLeft size={15} />
            بازگشت به نمونه‌کارها
          </Link>
          <p>چاپ روشن &bull; {work.title}</p>
        </div>
      </footer>
    </div>
  );
}

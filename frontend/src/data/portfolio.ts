export type PortfolioItem = {
  slug: string;
  title: string;
  category: string;
  image: string;
  gallery: string[];
  className?: string;
  client: string;
  year: string;
  description: string;
  fullDescription: string;
  specs: { label: string; value: string }[];
  services: string[];
  testimonial?: { text: string; author: string; role: string };
};

export const portfolioData: PortfolioItem[] = [
  {
    slug: "cafe-rost",
    title: "هویت چاپی کافه رُست",
    category: "هویت بصری و ملزومات",
    image: "/images/work-cafe.jpg",
    gallery: ["/images/work-cafe.jpg", "/images/work-cafe-gallery.jpg"],
    className: "portfolio-featured",
    client: "کافه رست",
    year: "۱۴۰۴",
    description: "طراحی و چاپ کامل ملزومات هویت بصری برای یک کافه مدرن با رویکرد مینیمال.",
    fullDescription:
      "برای کافه رُست، مجموعه کاملی از ملزومات چاپی هویت برند شامل منو، کارت ویزیت، لیبل محصولات و پاکت‌های کاغذی طراحی و چاپ شد. انتخاب کاغذ کرافت با بافت طبیعی، رنگ‌های گرم سفالی و مرکب تیره، حس صمیمی و خاکی کافه را در هر قطعه چاپی انعکاس می‌دهد. تمام ملزومات با چاپ افست تک‌رنگ و طلاکوب موضعی برای ایجاد عمق بصری اجرا شده است.",
    specs: [
      { label: "متریال", value: "کرافت ۲۸۰ گرم، گلاسه مات ۲۵۰ گرم" },
      { label: "ابعاد", value: "کارت ویزیت: ۹×۵.۵ / منو: ۲۱×۲۸.۵" },
      { label: "تعداد قطعات", value: "۶ قلم مختلف" },
      { label: "تیراژ", value: "۵۰۰ تا ۱۰۰۰ عدد از هر قلم" },
      { label: "خدمات تکمیلی", value: "طلاکوب مسی، برش اختصاصی منو" },
    ],
    services: ["چاپ افست", "طلاکوب", "برش اختصاصی", "صحافی سیمی منو"],
    testimonial: {
      text: "کیفیت چاپ و دقت در اجرای جزئیات فراتر از انتظار بود. مشتری‌های کافه از منوهای جدید تعریف می‌کنند.",
      author: "علی رضایی",
      role: "مدیر کافه رست",
    },
  },
  {
    slug: "avishan-packaging",
    title: "بسته‌بندی آویشن",
    category: "جعبه و لیبل محصول",
    image: "/images/work-packaging.jpg",
    gallery: ["/images/work-packaging.jpg", "/images/work-packaging-gallery.jpg"],
    className: "",
    client: "آویشن (برند محصولات طبیعی)",
    year: "۱۴۰۳",
    description: "بسته‌بندی اختصاصی برای خط محصولات طبیعی شامل جعبه، لیبل و بروشور.",
    fullDescription:
      "بسته‌بندی محصولات آویشن با هدف نمایش اصالت و طبیعی بودن محصول طراحی شد. از کاغذ کرافت با دستمال کاغذی بازیافتی، لیبل‌های چاپ دیجیتال با مرکب سبز زیتونی و جعبه‌های با روکش مات استفاده شده است. چاپ افست جعبه‌ها در تیراژ ۲۰۰۰ عددی انجام شد و لیبل‌ها با چاپ دیجیتال برای امکان شخصی‌سازی هر محصول چاپ شدند.",
    specs: [
      { label: "متریال", value: "کرافت ۳۵۰ گرم، لیبل‌های پی‌وی‌سی" },
      { label: "ابعاد جعبه", value: "۱۵×۱۰×۵ سانتیمتر" },
      { label: "چاپ", value: "افست + دیجیتال" },
      { label: "تیراژ", value: "جعبه: ۲۰۰۰ عدد / لیبل: ۵۰۰۰ عدد" },
      { label: "خدمات تکمیلی", value: "روکش مات، سلفون جعبه" },
    ],
    services: ["چاپ افست", "چاپ دیجیتال", "روکش سلفون", "برش لیبل"],
    testimonial: {
      text: "بسته‌بندی‌های جدید فروش ما را ۳۵٪ افزایش داد. مشتری‌ها از ظاهر محصول تعریف می‌کنند.",
      author: "مریم حیدری",
      role: "مدیر برند آویشن",
    },
  },
  {
    slug: "foram-nov-catalog",
    title: "کاتالوگ فرم نو",
    category: "چاپ و صحافی کاتالوگ",
    image: "/images/work-catalog.jpg",
    gallery: ["/images/work-catalog.jpg", "/images/work-catalog-gallery.jpg"],
    className: "",
    client: "فرم نو (دفتر معماری)",
    year: "۱۴۰۴",
    description: "کاتالوگ ۴۸ صفحه‌ای معماری با صحافی گالینگور و طراحی گرافیک مدرن.",
    fullDescription:
      "کاتالوگ پروژه‌های فرم نو با ۴۸ صفحه تمام رنگی، کاغذ گلاسه مات ۱۵۰ گرم و صحافی گالینگور چاپ شد. طراحی گرافیک با الهام از معماری مدرن، خطوط تمیز، فضاهای سفید گسترده و تایپوگرافی ساده دارد. جلد سخت با پارچه‌کشی و طلاکوب داغ، حس حرفه‌ای و ماندگاری را منتقل می‌کند. این کاتالوگ در نمایشگاه معماری پاریس ۲۰۲۴ توزیع شد.",
    specs: [
      { label: "قطع", value: "۲۲×۲۸ سانتیمتر" },
      { label: "تعداد صفحه", value: "۴۸ صفحه + جلد" },
      { label: "متریال", value: "گلاسه مات ۱۵۰ گرم داخلی، جلد سخت پارچه‌ای" },
      { label: "چاپ", value: "چاپ افست ۴ رنگ" },
      { label: "صحافی", value: "صحافی گالینگور با طلاکوب جلد" },
    ],
    services: ["چاپ افست", "صحافی گالینگور", "جلد پارچه‌ای", "طلاکوب جلد"],
    testimonial: {
      text: "کاتالوگ ما در نمایشگاه معماری پاریس بسیار تحسین شد. کیفیت چاپ و صحافی در سطح بین‌المللی بود.",
      author: "امیر کاظمی",
      role: "معمار ارشد فرم نو",
    },
  },
];

export function getPortfolioBySlug(slug: string): PortfolioItem | undefined {
  return portfolioData.find((item) => item.slug === slug);
}

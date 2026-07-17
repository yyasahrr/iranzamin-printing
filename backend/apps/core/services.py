class BaseService:
    """
    لایه سرویس پایه (Base Service Layer)
    طبق اصول معماری فاز چهارم، تمام منطق تجاری پلتفرم (Business Logic)
    به جای نوشتن مستقیم در Viewها، در متدهای کلاس‌های سرویس پیاده‌سازی می‌شوند.
    """
    def __init__(self, repository=None):
        self.repository = repository

    def execute(self, *args, **kwargs):
        raise NotImplementedError("سرویس‌ها باید متد execute را پیاده‌سازی کنند.")

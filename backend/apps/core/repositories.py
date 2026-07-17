class BaseRepository:
    """
    لایه مخزن پایه (Base Repository Layer)
    طبق معماری فاز چهارم، دسترسی به دیتابیس (Query و Read/Write)
    برای جداسازی کامل دیتابیس از وب‌سرویس در این لایه انجام می‌شود.
    """
    def __init__(self, model):
        self.model = model

    def get_by_id(self, id):
        return self.model.objects.filter(pk=id).first()

    def get_all(self):
        return self.model.objects.all()

    def create(self, **data):
        return self.model.objects.create(**data)

    def update(self, instance, **data):
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

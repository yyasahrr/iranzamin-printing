from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Category, Tag, MediaFile, Post, Page, FAQ, Course
from .serializers import (
    CategorySerializer,
    TagSerializer,
    MediaFileSerializer,
    PostSerializer,
    PageSerializer,
    FAQSerializer,
    CourseSerializer
)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class TagListView(generics.ListAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [AllowAny]


class FAQListView(generics.ListAPIView):
    queryset = FAQ.objects.all()
    serializer_class = FAQSerializer
    permission_classes = [AllowAny]


class PostListView(generics.ListAPIView):
    """لیست مقالات منتشر شده وبلاگ به همراه فیلتر دسته‌بندی و سرچ مرکزی"""
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Post.objects.filter(status='published')
        category_slug = self.request.query_params.get("category")
        tag_slug = self.request.query_params.get("tag")
        search_query = self.request.query_params.get("search")

        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        if tag_slug:
            queryset = queryset.filter(tags__slug=tag_slug)
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query) | 
                models.Q(content__icontains=search_query) |
                models.Q(summary__icontains=search_query)
            )
        return queryset


class PostDetailView(generics.RetrieveAPIView):
    """نمایش مشخصات مقاله چاپی و افزایش خودکار شمارنده تعداد کل بازدیدها"""
    queryset = Post.objects.filter(status='published')
    serializer_class = PostSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        # افزایش زنده شمارنده بازدید مقاله بدون تأخیر در لود
        post = self.get_object()
        post.view_count += 1
        post.save(update_fields=['view_count'])
        return response


class PageDetailView(generics.RetrieveAPIView):
    """نمایش جزئیات صفحات ایستا (About Us, Terms, Privacy)"""
    queryset = Page.objects.filter(status='published')
    serializer_class = PageSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]


class CourseListView(generics.ListAPIView):
    """لیست سرفصل‌های پرتال آموزشی آکادمی"""
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]


class MediaUploadView(APIView):
    """آپلود فایل جدید در کتابخانه چندرسانه‌ای چاپخانه"""
    permission_classes = [IsAuthenticated] # فقط کاربران مجاز اجازه آپلود دارند

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"success": False, "message": "فایلی ارسال نشده است."}, status=status.HTTP_400_BAD_REQUEST)

        # استخراج مشخصات و سایز فایل
        file_size = file_obj.size
        ext = file_obj.name.split('.')[-1].lower()
        file_type = 'image'
        if ext in ['pdf']:
            file_type = 'pdf'
        elif ext in ['mp4', 'mov']:
            file_type = 'video'
        elif ext in ['zip', 'rar', 'doc', 'docx']:
            file_type = 'document'

        media = MediaFile.objects.create(
            file=file_obj,
            file_type=file_type,
            file_size=file_size
        )

        serializer = MediaFileSerializer(media)
        return Response({
            "success": True,
            "message": "فایل با موفقیت در کتابخانه چندرسانه‌ای ذخیره شد.",
            "media": serializer.data
        }, status=status.HTTP_201_CREATED)

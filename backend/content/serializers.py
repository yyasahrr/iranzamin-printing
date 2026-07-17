from rest_framework import serializers
from .models import Category, Tag, MediaFile, Post, Page, FAQ, Course, Lesson


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'uuid', 'name', 'slug', 'description']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'uuid', 'name', 'slug']


class MediaFileSerializer(serializers.ModelSerializer):
    fileUrl = serializers.SerializerMethodField()

    class Meta:
        model = MediaFile
        fields = ['id', 'uuid', 'file', 'fileUrl', 'file_type', 'file_size', 'usage_count']

    def get_fileUrl(self, obj):
        if obj.file:
            return obj.file.url
        return None


class PostSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    featuredImage = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    publishDate = serializers.DateTimeField(source='publish_date', read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 
            'uuid', 
            'title', 
            'slug', 
            'summary', 
            'content', 
            'featuredImage', 
            'category', 
            'tags', 
            'status', 
            'publishDate', 
            'reading_time', 
            'view_count', 
            'meta_title', 
            'meta_description', 
            'canonical_url',
            'createdAt'
        ]

    def get_featuredImage(self, obj):
        if obj.featured_image and obj.featured_image.file:
            return obj.featured_image.file.url
        return None


class PageSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    pageType = serializers.CharField(source='get_page_type_display', read_only=True)

    class Meta:
        model = Page
        fields = [
            'id', 
            'uuid', 
            'title', 
            'slug', 
            'content', 
            'status', 
            'page_type', 
            'pageType', 
            'version', 
            'meta_title', 
            'meta_description', 
            'createdAt'
        ]


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ['id', 'uuid', 'question', 'answer', 'order_index']


class CourseSerializer(serializers.ModelSerializer):
    coverImageUrl = serializers.SerializerMethodField()
    instructor_name = serializers.CharField(source='instructor.full_name', read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'uuid', 'title', 'slug', 'summary', 'instructor_name', 'coverImageUrl']

    def get_coverImageUrl(self, obj):
        if obj.cover_image and obj.cover_image.file:
            return obj.cover_image.file.url
        return None

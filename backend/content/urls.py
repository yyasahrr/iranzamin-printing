from django.urls import path
from .views import (
    CategoryListView,
    TagListView,
    FAQListView,
    PostListView,
    PostDetailView,
    PageDetailView,
    CourseListView,
    MediaUploadView
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('tags/', TagListView.as_view(), name='tag_list'),
    path('faq/', FAQListView.as_view(), name='faq_list'),
    path('posts/', PostListView.as_view(), name='post_list'),
    path('posts/<slug:slug>/', PostDetailView.as_view(), name='post_detail'),
    path('pages/<slug:slug>/', PageDetailView.as_view(), name='page_detail'),
    path('courses/', CourseListView.as_view(), name='course_list'),
    path('media/upload/', MediaUploadView.as_view(), name='media_upload'),
]

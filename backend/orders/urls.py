from django.urls import path
from .views import (
    ProductListView,
    FinishListView,
    PriceEstimationView,
    OrderListCreateView,
    CallbackRequestCreateView,
    PortfolioProjectListView,
    PortfolioProjectDetailView,
    PaymentSimulationView
)

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product_list'),
    path('finishes/', FinishListView.as_view(), name='finish_list'),
    path('estimate-price/', PriceEstimationView.as_view(), name='price_estimation'),
    path('orders/', OrderListCreateView.as_view(), name='order_list_create'),
    path('orders/<str:tracking_code>/pay/', PaymentSimulationView.as_view(), name='order_payment_simulation'),
    path('callback/', CallbackRequestCreateView.as_view(), name='callback_request_create'),
    path('portfolio/', PortfolioProjectListView.as_view(), name='portfolio_list'),
    path('portfolio/<slug:slug>/', PortfolioProjectDetailView.as_view(), name='portfolio_detail'),
]

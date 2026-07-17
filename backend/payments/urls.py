from django.urls import path
from .views import (
    InvoiceListView,
    PaymentListView,
    PaymentInitiateView,
    PaymentCallbackView,
    RefundRequestView
)

urlpatterns = [
    path('invoices/', InvoiceListView.as_view(), name='invoice_list'),
    path('payments/', PaymentListView.as_view(), name='payment_list'),
    path('pay/initiate/', PaymentInitiateView.as_view(), name='payment_initiate'),
    path('callback/', PaymentCallbackView.as_view(), name='payment_callback'),
    path('refund/request/', RefundRequestView.as_view(), name='refund_request'),
]

# URL patterns for leave management endpoints.

from django.urls import path
from . import views

urlpatterns = [
    path("types/", views.LeaveTypeListView.as_view(), name="leave-type-list"),
    path("balances/", views.LeaveBalanceView.as_view(), name="leave-balance"),
    path("requests/", views.LeaveRequestListView.as_view(), name="leave-request-list"),
    path("requests/apply/", views.ApplyLeaveView.as_view(), name="apply-leave"),
    path("requests/<uuid:pk>/", views.LeaveRequestDetailView.as_view(), name="leave-request-detail"),
    path("requests/<uuid:pk>/approve/", views.ApproveLeaveView.as_view(), name="approve-leave"),
    path("requests/<uuid:pk>/reject/", views.RejectLeaveView.as_view(), name="reject-leave"),
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
]

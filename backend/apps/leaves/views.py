# Leave views — endpoints for applying, listing, approving, and rejecting leave.

import logging
from rest_framework import generics, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema

from .models import LeaveRequest, LeaveType, LeaveBalance
from .serializers import (
    LeaveRequestSerializer,
    ApplyLeaveSerializer,
    ReviewLeaveSerializer,
    LeaveTypeSerializer,
    LeaveBalanceSerializer,
)
from .service import LeaveService
from .filters import LeaveRequestFilter
from apps.users.permissions import IsAdmin, IsManager

logger = logging.getLogger("apps.leaves")


class LeaveTypeListView(generics.ListCreateAPIView):
    """List all leave types. Admin can add new ones."""
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    pagination_class = None

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [IsAuthenticated()]


class LeaveBalanceView(generics.ListAPIView):
    """Return the current year's leave balances for the logged-in user."""
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        from datetime import date
        year = self.request.query_params.get("year", date.today().year)
        from .repository import LeaveBalanceRepository
        return LeaveBalanceRepository().get_balances_for_user(self.request.user, year)


class LeaveRequestListView(generics.ListAPIView):
    """
    Employees see their own requests.
    Managers see requests from their team.
    Admins see everything.
    """
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LeaveRequestFilter
    search_fields = ["employee__first_name", "employee__last_name", "reason"]
    ordering_fields = ["applied_on", "start_date", "status"]
    ordering = ["-applied_on"]

    def get_queryset(self):
        user = self.request.user
        from .repository import LeaveRequestRepository
        repo = LeaveRequestRepository()

        if user.role == "admin":
            return repo.get_all()
        elif user.role == "manager":
            return repo.get_for_manager(user)
        else:
            return repo.get_for_employee(user)


class ApplyLeaveView(APIView):
    """Employee submits a new leave request."""
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ApplyLeaveSerializer, responses=LeaveRequestSerializer)
    def post(self, request):
        serializer = ApplyLeaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = LeaveService()
        leave_request = service.apply_leave(request.user, serializer.validated_data)
        out = LeaveRequestSerializer(leave_request)
        return Response(out.data, status=status.HTTP_201_CREATED)


class LeaveRequestDetailView(generics.RetrieveDestroyAPIView):
    """Get details of a single request. Employee can also cancel it via DELETE."""
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        requests = LeaveRequest.objects.select_related(
            "employee", "leave_type", "reviewed_by"
        )
        user = self.request.user
        if user.role == "manager":
            requests = requests.filter(employee__manager=user)
        elif user.role != "admin":
            requests = requests.filter(employee=user)
        return get_object_or_404(requests, pk=self.kwargs["pk"])

    def delete(self, request, *args, **kwargs):
        # Reusing DELETE for cancel (no hard deletion)
        service = LeaveService()
        leave_request = service.cancel_leave(request.user, self.kwargs["pk"])
        out = LeaveRequestSerializer(leave_request)
        return Response(out.data)


class ApproveLeaveView(APIView):
    """Manager or Admin approves a pending request."""
    permission_classes = [IsManager]

    @extend_schema(request=ReviewLeaveSerializer, responses=LeaveRequestSerializer)
    def post(self, request, pk):
        serializer = ReviewLeaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = LeaveService()
        leave_request = service.approve_leave(
            request.user, pk, serializer.validated_data.get("comment", "")
        )
        out = LeaveRequestSerializer(leave_request)
        return Response(out.data)


class RejectLeaveView(APIView):
    """Manager or Admin rejects a pending request."""
    permission_classes = [IsManager]

    @extend_schema(request=ReviewLeaveSerializer, responses=LeaveRequestSerializer)
    def post(self, request, pk):
        serializer = ReviewLeaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = LeaveService()
        leave_request = service.reject_leave(
            request.user, pk, serializer.validated_data.get("comment", "")
        )
        out = LeaveRequestSerializer(leave_request)
        return Response(out.data)


class DashboardView(APIView):
    """Returns summary stats for the dashboard — different per role."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from datetime import date
        from .repository import LeaveRequestRepository, LeaveBalanceRepository

        leave_repo = LeaveRequestRepository()
        balance_repo = LeaveBalanceRepository()
        user = request.user
        today = date.today()

        if user.role == "employee":
            requests = leave_repo.get_for_employee(user)
            balances = balance_repo.get_balances_for_user(user, today.year)
            data = {
                "total_requests": requests.count(),
                "pending": requests.filter(status="pending").count(),
                "approved": requests.filter(status="approved").count(),
                "rejected": requests.filter(status="rejected").count(),
                "balances": LeaveBalanceSerializer(balances, many=True).data,
            }
        elif user.role == "manager":
            team_requests = leave_repo.get_for_manager(user)
            data = {
                "team_total": team_requests.count(),
                "pending_approvals": team_requests.filter(status="pending").count(),
                "approved_this_month": team_requests.filter(
                    status="approved",
                    reviewed_on__month=today.month,
                    reviewed_on__year=today.year,
                ).count(),
            }
        else:
            # Admin gets a system-wide overview
            all_requests = leave_repo.get_all()
            data = {
                "total_requests": all_requests.count(),
                "pending": all_requests.filter(status="pending").count(),
                "approved": all_requests.filter(status="approved").count(),
                "rejected": all_requests.filter(status="rejected").count(),
                "on_leave_today": all_requests.filter(
                    status="approved",
                    start_date__lte=today,
                    end_date__gte=today,
                ).count(),
            }

        return Response(data)

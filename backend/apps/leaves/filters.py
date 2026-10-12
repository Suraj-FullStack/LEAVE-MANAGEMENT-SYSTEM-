# django-filter FilterSet for leave requests.
# Allows filtering by status, leave type, date range, and department.

import django_filters
from .models import LeaveRequest


class LeaveRequestFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status", lookup_expr="exact")
    leave_type = django_filters.NumberFilter(field_name="leave_type__id")
    department = django_filters.CharFilter(field_name="employee__department", lookup_expr="iexact")
    start_date_from = django_filters.DateFilter(field_name="start_date", lookup_expr="gte")
    start_date_to = django_filters.DateFilter(field_name="start_date", lookup_expr="lte")

    class Meta:
        model = LeaveRequest
        fields = ["status", "leave_type", "department", "start_date_from", "start_date_to"]

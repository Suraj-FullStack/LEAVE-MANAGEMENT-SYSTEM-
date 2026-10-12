# Registers leave models in Django admin.

from django.contrib import admin
from .models import LeaveType, LeaveBalance, LeaveRequest


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "max_days_per_year", "description"]
    search_fields = ["name"]


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ["user", "leave_type", "year", "total_days", "days_taken", "days_pending"]
    list_filter = ["leave_type", "year"]
    search_fields = ["user__email", "user__first_name", "user__last_name"]


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = [
        "employee", "leave_type", "start_date", "end_date",
        "num_days", "status", "applied_on"
    ]
    list_filter = ["status", "leave_type"]
    search_fields = ["employee__email", "employee__first_name", "employee__last_name"]
    readonly_fields = ["applied_on"]

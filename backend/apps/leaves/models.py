# Leave-related models: LeaveType, LeaveBalance, LeaveRequest.
# These three tables form the core of the system.

import uuid
from django.db import models
from django.conf import settings


class LeaveType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    max_days_per_year = models.PositiveIntegerField(default=20)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "leaves_leavetype"
        ordering = ["name"]

    def __str__(self):
        return self.name


class LeaveBalance(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="leave_balances",
    )
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    year = models.PositiveIntegerField()
    total_days = models.PositiveIntegerField()
    days_taken = models.PositiveIntegerField(default=0)
    days_pending = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "leaves_leavebalance"
        unique_together = ("user", "leave_type", "year")

    @property
    def days_available(self):
        return self.total_days - self.days_taken - self.days_pending

    def __str__(self):
        return f"{self.user} | {self.leave_type} | {self.year}"


class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("cancelled", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="leave_requests",
    )
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT)
    start_date = models.DateField()
    end_date = models.DateField()
    num_days = models.PositiveIntegerField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    applied_on = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_requests",
    )
    reviewed_on = models.DateTimeField(null=True, blank=True)
    manager_comment = models.TextField(blank=True)

    class Meta:
        db_table = "leaves_leaverequest"
        ordering = ["-applied_on"]

    def __str__(self):
        return f"{self.employee.full_name} — {self.leave_type} ({self.status})"

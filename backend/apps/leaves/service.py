# Leave service — business logic for applying, approving, and rejecting leave.
# Enforces the overlap check, balance check, and approval workflow.

import logging
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied

from .repository import LeaveRequestRepository, LeaveBalanceRepository, LeaveTypeRepository
from apps.notifications.service import NotificationService

logger = logging.getLogger("apps.leaves")


class LeaveService:
    def __init__(self):
        self.leave_repo = LeaveRequestRepository()
        self.balance_repo = LeaveBalanceRepository()
        self.type_repo = LeaveTypeRepository()
        self.notification_service = NotificationService()

    def _calculate_days(self, start_date, end_date):
        # Simple calendar day count (inclusive); weekends are not excluded for now
        delta = (end_date - start_date).days + 1
        if delta <= 0:
            raise ValidationError({"end_date": "End date must be after start date."})
        return delta

    @transaction.atomic
    def apply_leave(self, employee, validated_data):
        employee = employee.__class__.objects.select_for_update().get(pk=employee.pk)
        leave_type = validated_data["leave_type"]
        start_date = validated_data["start_date"]
        end_date = validated_data["end_date"]
        year = start_date.year

        num_days = self._calculate_days(start_date, end_date)

        # Rule 1: no overlapping active leave requests
        overlapping = self.leave_repo.get_overlapping(employee, start_date, end_date)
        if overlapping.exists():
            raise ValidationError(
                {"non_field_errors": "You already have a leave request overlapping these dates."}
            )

        # Rule 2: enough balance remaining
        balance = self.balance_repo.get_or_create_balance(employee, leave_type, year)
        if balance.days_available < num_days:
            raise ValidationError(
                {
                    "non_field_errors": (
                        f"Insufficient balance. You have {balance.days_available} day(s) "
                        f"available but requested {num_days}."
                    )
                }
            )

        # Create the request and hold the days as pending
        leave_request = self.leave_repo.create(
            employee=employee,
            leave_type=leave_type,
            start_date=start_date,
            end_date=end_date,
            num_days=num_days,
            reason=validated_data["reason"],
        )
        balance.days_pending += num_days
        balance.save()

        # Notify manager if the employee has one
        if employee.manager:
            self.notification_service.notify(
                recipient=employee.manager,
                message=(
                    f"{employee.full_name} applied for {leave_type.name} "
                    f"from {start_date} to {end_date}."
                ),
            )

        logger.info(
            "Leave applied: employee=%s type=%s days=%d",
            employee.email, leave_type.name, num_days,
        )
        return leave_request

    @transaction.atomic
    def approve_leave(self, reviewer, leave_id, comment=""):
        leave_request = self.leave_repo.get_by_id(leave_id, for_update=True)
        if not leave_request:
            raise ValidationError({"detail": "Leave request not found."})

        # Only the employee's manager or an admin can approve
        self._check_reviewer_permission(reviewer, leave_request)

        if leave_request.status != "pending":
            raise ValidationError({"detail": "Only pending requests can be approved."})

        leave_request.status = "approved"
        leave_request.reviewed_by = reviewer
        leave_request.reviewed_on = timezone.now()
        leave_request.manager_comment = comment
        self.leave_repo.save(leave_request)

        # Move days from pending to taken in the balance
        balance = self.balance_repo.get_balance(
            leave_request.employee,
            leave_request.leave_type,
            leave_request.start_date.year,
            for_update=True,
        )
        if not balance:
            raise ValidationError({"detail": "Leave balance not found for this request."})
        balance.days_pending -= leave_request.num_days
        balance.days_taken += leave_request.num_days
        balance.save()

        self.notification_service.notify(
            recipient=leave_request.employee,
            message=(
                f"Your {leave_request.leave_type.name} request "
                f"({leave_request.start_date} to {leave_request.end_date}) was approved."
            ),
        )
        logger.info("Leave approved: id=%s by=%s", leave_id, reviewer.email)
        return leave_request

    @transaction.atomic
    def reject_leave(self, reviewer, leave_id, comment=""):
        leave_request = self.leave_repo.get_by_id(leave_id, for_update=True)
        if not leave_request:
            raise ValidationError({"detail": "Leave request not found."})

        self._check_reviewer_permission(reviewer, leave_request)

        if leave_request.status != "pending":
            raise ValidationError({"detail": "Only pending requests can be rejected."})

        leave_request.status = "rejected"
        leave_request.reviewed_by = reviewer
        leave_request.reviewed_on = timezone.now()
        leave_request.manager_comment = comment
        self.leave_repo.save(leave_request)

        # Release the pending days back to available
        balance = self.balance_repo.get_balance(
            leave_request.employee,
            leave_request.leave_type,
            leave_request.start_date.year,
            for_update=True,
        )
        if not balance:
            raise ValidationError({"detail": "Leave balance not found for this request."})
        balance.days_pending -= leave_request.num_days
        balance.save()

        self.notification_service.notify(
            recipient=leave_request.employee,
            message=(
                f"Your {leave_request.leave_type.name} request "
                f"({leave_request.start_date} to {leave_request.end_date}) was rejected. "
                f"Reason: {comment}"
            ),
        )
        logger.info("Leave rejected: id=%s by=%s", leave_id, reviewer.email)
        return leave_request

    @transaction.atomic
    def cancel_leave(self, user, leave_id):
        leave_request = self.leave_repo.get_by_id(leave_id, for_update=True)
        if not leave_request:
            raise ValidationError({"detail": "Leave request not found."})

        # Only the employee who applied can cancel
        if leave_request.employee != user:
            raise PermissionDenied("You can only cancel your own leave requests.")

        if leave_request.status not in ("pending", "approved"):
            raise ValidationError({"detail": "This request cannot be cancelled."})

        prev_status = leave_request.status
        leave_request.status = "cancelled"
        self.leave_repo.save(leave_request)

        # Release days from either pending or taken depending on previous status
        balance = self.balance_repo.get_balance(
            leave_request.employee,
            leave_request.leave_type,
            leave_request.start_date.year,
            for_update=True,
        )
        if not balance:
            raise ValidationError({"detail": "Leave balance not found for this request."})
        if prev_status == "pending":
            balance.days_pending -= leave_request.num_days
        elif prev_status == "approved":
            balance.days_taken -= leave_request.num_days
        balance.save()

        logger.info("Leave cancelled: id=%s by=%s", leave_id, user.email)
        return leave_request

    def _check_reviewer_permission(self, reviewer, leave_request):
        # Admins can review anything; managers can only review their reports
        if reviewer.role == "admin":
            return
        if reviewer.role == "manager":
            if leave_request.employee.manager != reviewer:
                raise PermissionDenied("You can only review leave requests from your team.")
            return
        raise PermissionDenied("Employees cannot approve or reject leave requests.")

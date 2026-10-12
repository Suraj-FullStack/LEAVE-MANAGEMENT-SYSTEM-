from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.notifications.models import Notification
from .models import LeaveBalance, LeaveRequest, LeaveType

User = get_user_model()


class ListEndpointContractTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="test-password",
        )
        self.client.force_authenticate(self.user)

    def test_leave_types_are_returned_as_an_array(self):
        LeaveType.objects.create(name="Annual Leave")

        response = self.client.get("/api/leaves/types/")

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)

    def test_leave_balances_are_returned_as_an_array(self):
        leave_type = LeaveType.objects.create(name="Annual Leave")
        LeaveBalance.objects.create(
            user=self.user,
            leave_type=leave_type,
            year=date.today().year,
            total_days=20,
        )

        response = self.client.get("/api/leaves/balances/")

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)

    def test_notifications_are_returned_as_an_array(self):
        Notification.objects.create(recipient=self.user, message="Request update")

        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)

    def test_employee_cannot_read_another_employees_request(self):
        other_employee = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="test-password",
        )
        leave_type = LeaveType.objects.create(name="Annual Leave")
        leave_request = LeaveRequest.objects.create(
            employee=other_employee,
            leave_type=leave_type,
            start_date=date.today(),
            end_date=date.today(),
            num_days=1,
            reason="Personal appointment",
        )

        response = self.client.get(f"/api/leaves/requests/{leave_request.id}/")

        self.assertEqual(response.status_code, 404)


class LeaveWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manager = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="test-password",
            role="manager",
        )
        self.employee = User.objects.create_user(
            username="workflow-employee",
            email="workflow-employee@example.com",
            password="test-password",
            manager=self.manager,
        )
        self.leave_type = LeaveType.objects.create(
            name="Workflow Leave",
            max_days_per_year=20,
        )
        self.balance = LeaveBalance.objects.create(
            user=self.employee,
            leave_type=self.leave_type,
            year=date.today().year,
            total_days=20,
        )

    def apply_leave(self):
        self.client.force_authenticate(self.employee)
        return self.client.post(
            "/api/leaves/requests/apply/",
            {
                "leave_type": self.leave_type.id,
                "start_date": date.today().isoformat(),
                "end_date": date.today().isoformat(),
                "reason": "Personal appointment",
            },
            format="json",
        )

    def test_apply_approve_and_cancel_updates_balance(self):
        applied = self.apply_leave()

        self.assertEqual(applied.status_code, 201)
        request_id = applied.data["id"]
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.days_pending, 1)

        self.client.force_authenticate(self.manager)
        approved = self.client.post(
            f"/api/leaves/requests/{request_id}/approve/",
            {"comment": "Approved"},
            format="json",
        )

        self.assertEqual(approved.status_code, 200)
        self.assertEqual(approved.data["status"], "approved")
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.days_pending, 0)
        self.assertEqual(self.balance.days_taken, 1)

        self.client.force_authenticate(self.employee)
        cancelled = self.client.delete(f"/api/leaves/requests/{request_id}/")

        self.assertEqual(cancelled.status_code, 200)
        self.assertEqual(cancelled.data["status"], "cancelled")
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.days_pending, 0)
        self.assertEqual(self.balance.days_taken, 0)

    def test_rejecting_leave_releases_pending_balance(self):
        applied = self.apply_leave()
        self.assertEqual(applied.status_code, 201)

        self.client.force_authenticate(self.manager)
        rejected = self.client.post(
            f"/api/leaves/requests/{applied.data['id']}/reject/",
            {"comment": "Please choose another date"},
            format="json",
        )

        self.assertEqual(rejected.status_code, 200)
        self.assertEqual(rejected.data["status"], "rejected")
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.days_pending, 0)
        self.assertEqual(self.balance.days_taken, 0)

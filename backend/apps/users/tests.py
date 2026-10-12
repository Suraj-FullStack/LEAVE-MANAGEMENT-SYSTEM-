from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


class UserEndpointContractTests(TestCase):
    def test_user_list_is_returned_as_an_array(self):
        admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="test-password",
            role="admin",
        )
        client = APIClient()
        client.force_authenticate(admin)

        response = client.get("/api/auth/users/")

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)

    def test_public_registration_cannot_assign_privileged_fields(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "new-employee@example.com",
                "username": "new-employee",
                "first_name": "New",
                "last_name": "Employee",
                "password": "test-password",
                "confirm_password": "test-password",
                "department": "Engineering",
                "role": "admin",
            },
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email="new-employee@example.com")
        self.assertEqual(user.role, "employee")
        self.assertIsNone(user.manager_id)

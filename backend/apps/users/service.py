# User service — business logic for user management and auth.
# Sits between views and the repository.

import logging
from rest_framework.exceptions import ValidationError
from .repository import UserRepository

logger = logging.getLogger("apps.users")


class UserService:
    def __init__(self):
        self.repo = UserRepository()

    def register_user(self, validated_data):
        email = validated_data.get("email")
        if self.repo.get_by_email(email):
            raise ValidationError({"email": "A user with this email already exists."})

        user = self.repo.create_user(**validated_data)
        logger.info("New user registered: %s (role=%s)", user.email, user.role)
        return user

    def get_user_profile(self, user_id):
        user = self.repo.get_by_id(user_id)
        if not user:
            raise ValidationError({"detail": "User not found."})
        return user

    def update_profile(self, user, validated_data):
        updated = self.repo.update_user(user, **validated_data)
        logger.info("User profile updated: %s", user.email)
        return updated

    def list_employees_for_manager(self, manager):
        return self.repo.get_employees_under_manager(manager)

    def list_all_users(self):
        return self.repo.get_all()

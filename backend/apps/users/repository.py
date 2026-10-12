# User repository — all database queries for users go here.
# The service layer calls these methods; views never touch the ORM directly.

from django.contrib.auth import get_user_model

User = get_user_model()


class UserRepository:

    def get_by_id(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    def get_by_email(self, email):
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None

    def get_all(self):
        return User.objects.all().select_related("manager")

    def get_employees_under_manager(self, manager):
        # Returns all users who report to this manager
        return User.objects.filter(manager=manager)

    def create_user(self, **data):
        password = data.pop("password")
        user = User(**data)
        user.set_password(password)
        user.save()
        return user

    def update_user(self, user, **data):
        for field, value in data.items():
            setattr(user, field, value)
        user.save()
        return user

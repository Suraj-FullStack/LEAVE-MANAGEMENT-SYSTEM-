# Registers the custom User model in Django admin.

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "first_name", "last_name", "role", "department", "is_active"]
    list_filter = ["role", "department", "is_active"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["email"]

    fieldsets = BaseUserAdmin.fieldsets + (
        ("Role & Department", {"fields": ("role", "department", "manager")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email", "username", "first_name", "last_name",
                "role", "department", "manager",
                "password1", "password2",
            ),
        }),
    )

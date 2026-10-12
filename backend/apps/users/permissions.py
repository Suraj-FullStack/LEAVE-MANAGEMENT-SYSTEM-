# Custom DRF permission classes for role-based access control.

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("manager", "admin")


class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "employee"


class IsOwnerOrAdmin(BasePermission):
    # Allows access only if the user owns the object, or is an admin
    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        # obj.employee for leave requests, obj for user profiles
        owner = getattr(obj, "employee", obj)
        return owner == request.user

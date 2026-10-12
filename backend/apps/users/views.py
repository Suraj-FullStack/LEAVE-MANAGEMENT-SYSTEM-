# Auth and user management views.
# Register, login (handled by SimpleJWT), profile, admin user list.

import logging
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema

from .serializers import RegisterSerializer, UserSerializer, UpdateUserSerializer
from .service import UserService
from .permissions import IsAdmin

logger = logging.getLogger("apps.users")


class RegisterView(generics.CreateAPIView):
    """Anyone can register; no token needed."""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    @extend_schema(summary="Register a new user")
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"detail": "Registration successful.", "user_id": str(user.id)},
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    """Blacklists the refresh token so it can't be reused."""
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Logout (blacklist refresh token)")
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Logged out successfully."})
        except Exception:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the logged-in user's own profile."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UpdateUserSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


class UserListView(generics.ListAPIView):
    """Admin-only: list all users with search and filter."""
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["role", "department", "is_active"]
    search_fields = ["email", "first_name", "last_name"]
    ordering_fields = ["first_name", "date_joined"]

    def get_queryset(self):
        service = UserService()
        return service.list_all_users()


class UserDetailView(generics.RetrieveUpdateAPIView):
    """Admin-only: view or update any user."""
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_object(self):
        user_id = self.kwargs["pk"]
        service = UserService()
        return service.get_user_profile(user_id)

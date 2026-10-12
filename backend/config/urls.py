"""
Root URL config. Wires each app's urls together and adds the
Swagger / Redoc API docs.
"""

from django.contrib import admin  # type: ignore[reportMissingImports]
try:
    from django.urls import include, path  # type: ignore[reportMissingImports]
except ImportError as exc:
    raise ImportError(
        "Django is required to load the URL configuration. "
        "Install the backend dependencies in the active Python environment."
    ) from exc
try:
    from drf_spectacular.views import (  # type: ignore[import-not-found]
        SpectacularAPIView,
        SpectacularSwaggerView,
        SpectacularRedocView,
    )
except ImportError as exc:
    raise ImportError(
        "drf-spectacular is required to load the API documentation routes. "
        "Install the backend dependencies in the active Python environment."
    ) from exc

urlpatterns = [
    path("admin/", admin.site.urls),

    # App routes
    path("api/auth/", include("apps.users.urls")),
    path("api/leaves/", include("apps.leaves.urls")),
    path("api/notifications/", include("apps.notifications.urls")),

    # API docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
# Notification views — list, mark as read, unread count.

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .repository import NotificationRepository
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """Returns all notifications for the current user, newest first."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        repo = NotificationRepository()
        return repo.get_for_user(self.request.user)


class MarkReadView(APIView):
    """Mark a single notification as read."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        repo = NotificationRepository()
        n = repo.mark_as_read(pk, request.user)
        if not n:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(NotificationSerializer(n).data)


class MarkAllReadView(APIView):
    """Mark all unread notifications as read in one call."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        repo = NotificationRepository()
        repo.mark_all_as_read(request.user)
        return Response({"detail": "All notifications marked as read."})


class UnreadCountView(APIView):
    """Returns just the count of unread notifications — used by the navbar badge."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        repo = NotificationRepository()
        count = repo.get_unread_count(request.user)
        return Response({"unread_count": count})

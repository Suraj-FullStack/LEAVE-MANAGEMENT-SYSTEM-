# Notification repository — queries for creating and fetching notifications.

from .models import Notification


class NotificationRepository:
    def create(self, recipient, message):
        return Notification.objects.create(recipient=recipient, message=message)

    def get_for_user(self, user):
        return Notification.objects.filter(recipient=user)

    def mark_as_read(self, notification_id, user):
        try:
            n = Notification.objects.get(id=notification_id, recipient=user)
            n.is_read = True
            n.save()
            return n
        except Notification.DoesNotExist:
            return None

    def mark_all_as_read(self, user):
        Notification.objects.filter(recipient=user, is_read=False).update(is_read=True)

    def get_unread_count(self, user):
        return Notification.objects.filter(recipient=user, is_read=False).count()

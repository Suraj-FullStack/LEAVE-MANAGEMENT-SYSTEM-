# Notification service — creates notifications triggered by leave events.

import logging
from .repository import NotificationRepository

logger = logging.getLogger("apps.notifications")


class NotificationService:
    def __init__(self):
        self.repo = NotificationRepository()

    def notify(self, recipient, message):
        notification = self.repo.create(recipient=recipient, message=message)
        logger.debug("Notification created for %s: %s", recipient.email, message[:60])
        return notification

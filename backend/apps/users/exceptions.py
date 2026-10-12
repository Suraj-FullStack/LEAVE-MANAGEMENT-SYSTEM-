# Global exception handler that wraps DRF's default with extra logging.
# Returns consistent JSON error shapes across the whole API.

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger("apps.users")


def custom_exception_handler(exc, context):
    # Let DRF handle it first so we get a Response back
    response = exception_handler(exc, context)

    if response is not None:
        # Normalise the error payload so the frontend can always read `error.detail`
        error_detail = response.data
        response.data = {
            "status": "error",
            "status_code": response.status_code,
            "detail": error_detail,
        }
        logger.warning(
            "API error %s at %s: %s",
            response.status_code,
            context.get("request").path if context.get("request") else "unknown",
            error_detail,
        )
    else:
        # Unhandled exception — log it and return a generic 500
        logger.exception("Unhandled exception in view: %s", exc)
        response = Response(
            {
                "status": "error",
                "status_code": 500,
                "detail": "An unexpected server error occurred.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response

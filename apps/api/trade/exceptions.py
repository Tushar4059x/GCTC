from rest_framework import exceptions
from rest_framework.response import Response
from rest_framework.views import exception_handler


class ApiError(Exception):
    """Domain error rendered as the {statusCode, error, message} JSON shape
    the web client's ApiError class expects."""

    def __init__(self, status_code, code, message):
        super().__init__(message)
        self.status_code = status_code
        self.code = code


def unauthorized(message='Authentication required'):
    return ApiError(401, 'UNAUTHORIZED', message)


def forbidden(message='You do not have permission to do this'):
    return ApiError(403, 'FORBIDDEN', message)


def not_found(message='Resource not found'):
    return ApiError(404, 'NOT_FOUND', message)


def conflict(code, message):
    return ApiError(409, code, message)


def bad_request(message):
    return ApiError(400, 'BAD_REQUEST', message)


def _body(status_code, code, message):
    return {'statusCode': status_code, 'error': code, 'message': message}


def api_exception_handler(exc, context):
    if isinstance(exc, ApiError):
        return Response(_body(exc.status_code, exc.code, str(exc)), status=exc.status_code)
    if isinstance(exc, exceptions.Throttled):
        return Response(_body(429, 'RATE_LIMITED', 'Too many requests, retry shortly'), status=429)
    if isinstance(exc, (exceptions.NotAuthenticated, exceptions.AuthenticationFailed)):
        return Response(_body(401, 'UNAUTHORIZED', 'Authentication required'), status=401)
    if isinstance(exc, exceptions.PermissionDenied):
        return Response(_body(403, 'FORBIDDEN', str(exc.detail)), status=403)

    response = exception_handler(exc, context)
    if response is not None:
        message = response.data.get('detail', 'Request failed') if isinstance(response.data, dict) else 'Request failed'
        response.data = _body(response.status_code, 'ERROR', str(message))
        return response
    return None

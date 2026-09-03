class AppException(Exception):
    def __init__(self, message: str, error_code: str = "APP_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class EntityNotFoundError(AppException):
    def __init__(self, entity_name: str, identifier: str | int):
        self.entity_name = entity_name
        self.identifier = identifier
        message = f"{entity_name} with identifier '{identifier}' was not found"
        super().__init__(message, error_code="ENTITY_NOT_FOUND")


class UserNotFoundError(EntityNotFoundError):
    def __init__(self, identifier: str | int):
        super().__init__("User", identifier)


class SchemeNotFoundError(EntityNotFoundError):
    def __init__(self, identifier: str | int):
        super().__init__("Scheme", identifier)


class ProfileNotFoundError(EntityNotFoundError):
    def __init__(self, identifier: str | int):
        super().__init__("Profile", identifier)


class DuplicateEntityError(AppException):
    def __init__(self, message: str):
        super().__init__(message, error_code="DUPLICATE_ENTITY")


class AuthenticationError(AppException):
    def __init__(self, message: str = "Invalid email or password"):
        super().__init__(message, error_code="AUTHENTICATION_FAILED")


class InvalidTokenError(AppException):
    def __init__(self, message: str = "Invalid or expired token"):
        super().__init__(message, error_code="INVALID_TOKEN")


class PermissionDeniedError(AppException):
    def __init__(self, message: str = "Administrator privileges are required to perform this action"):
        super().__init__(message, error_code="PERMISSION_DENIED")


class BusinessRuleError(AppException):
    def __init__(self, message: str):
        super().__init__(message, error_code="BUSINESS_RULE_VIOLATION")


class InvalidFileFormatError(AppException):
    def __init__(self, message: str = "Invalid file format or file size limit exceeded"):
        super().__init__(message, error_code="INVALID_FILE_FORMAT")

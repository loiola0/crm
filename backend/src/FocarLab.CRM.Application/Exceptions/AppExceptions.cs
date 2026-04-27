namespace FocarLab.CRM.Application.Exceptions;

public sealed class NotFoundException(string message) : Exception(message);
public sealed class AppValidationException(string message) : Exception(message);
public sealed class AppUnauthorizedException(string message) : Exception(message);

using System.Text.Json;
using FocarLab.CRM.Application.Exceptions;
using Serilog;

namespace FocarLab.CRM.API.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            var (statusCode, title) = exception switch
            {
                NotFoundException => (StatusCodes.Status404NotFound, "Not Found"),
                AppValidationException => (StatusCodes.Status400BadRequest, "Validation Error"),
                AppUnauthorizedException => (StatusCodes.Status401Unauthorized, "Unauthorized"),
                _ => (StatusCodes.Status500InternalServerError, "Server Error")
            };

            if (statusCode >= 500)
            {
                Log.Error(exception, "Unhandled exception while processing {Path}", context.Request.Path);
            }
            else
            {
                Log.Warning(exception, "Handled exception while processing {Path}", context.Request.Path);
            }

            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                title,
                status = statusCode,
                detail = exception.Message
            }));
        }
    }
}

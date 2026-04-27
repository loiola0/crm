FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/FocarLab.CRM.sln backend/FocarLab.CRM.sln
COPY backend/.config backend/.config
COPY backend/src/FocarLab.CRM.Domain/FocarLab.CRM.Domain.csproj backend/src/FocarLab.CRM.Domain/
COPY backend/src/FocarLab.CRM.Application/FocarLab.CRM.Application.csproj backend/src/FocarLab.CRM.Application/
COPY backend/src/FocarLab.CRM.Infrastructure/FocarLab.CRM.Infrastructure.csproj backend/src/FocarLab.CRM.Infrastructure/
COPY backend/src/FocarLab.CRM.API/FocarLab.CRM.API.csproj backend/src/FocarLab.CRM.API/

WORKDIR /src/backend
RUN dotnet restore FocarLab.CRM.sln

COPY backend/. .
RUN dotnet publish src/FocarLab.CRM.API/FocarLab.CRM.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "FocarLab.CRM.API.dll"]

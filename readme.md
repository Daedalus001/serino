# Serino Mini Project

## Prerequisites
1. Visual Studio Code
2. PostgreSQL

## How to use
1. Clone the repository.
2. run **npm install** on the folder directory.
3. run **npx tsc** on the folder directory.
4. click Launch Program using Visual Studio Code.

## Postman Details
> Endpoint : http://localhost:3000/geolocation

> Method : POST

Payload

```
{
    "Latitude":<number>,
    "Longitude":<number>,
    "Distance":<number>,
    "Prize":<number><optional>
}
```


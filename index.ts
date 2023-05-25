import express = require("express");
import { ParameterizedQuery } from "pg-promise";
import { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import pgPromise = require("pg-promise");
const app: Application = express();
const port: Number = 3000;

const Pgp = pgPromise({ schema: "ser" });
const DB_CONNECTION_STRINGS = {
  host: String("localhost"),
  port: Number("5432"),
  database: String("serino"),
  user: String("postgres"),
  password: String("serino01"),
  ssl: false,
};

const Db = Pgp(DB_CONNECTION_STRINGS);

const DEGREE_PER_KILOMETER: number = 1 / 111; //get Kilometers per degree value in latitude/longitude

interface Coordinates {
  Latitude: number;
  Longitude: number;
}

function IsInsideTheRadius(
  treasureCoordinates: Coordinates,
  centerCoordinates: Coordinates,
  distance: number
) {
  const circleDistance =
    Math.pow(treasureCoordinates.Latitude - centerCoordinates.Latitude, 2) +
    Math.pow(treasureCoordinates.Longitude - centerCoordinates.Longitude, 2);
  return circleDistance <= Math.pow(distance * DEGREE_PER_KILOMETER, 2)
    ? true
    : false;
}

function GetAllTreasures() {
  const getAllTreasures = new ParameterizedQuery(
    `SELECT * FROM treasures LEFT JOIN money_values ON treasures.id=money_values.treasure_id`
  );
  return Db.any(getAllTreasures);
}

async function GetTreasure(req: Request, res: Response) {
  const reqValues = {
    Latitude: Number(req.body.Latitude),
    Longitude: Number(req.body.Longitude),
    Distance: Number(req.body.Distance),
    Prize: Number(req.body.Prize),
  };
  if (
    reqValues.Prize &&
    (reqValues.Prize < 10 ||
      reqValues.Prize > 30 ||
      reqValues.Prize !== Math.ceil(reqValues.Prize))
  ) {
    res.statusCode = 400;
    res.send("Invalid Prize");
    return;
  }
  if (
    reqValues.Latitude &&
    reqValues.Longitude &&
    (reqValues.Distance === 1 || reqValues.Distance === 10)
  ) {
    let response: any[] = [];
    let responseCounter = 0;
    await GetAllTreasures()
      .then((queryResult) => {
        for (const index in queryResult) {
          const treasureCoordinates = {
            Latitude: queryResult[index].latitude,
            Longitude: queryResult[index].longitude,
          };
          const centerCoordinates = {
            Latitude: reqValues.Latitude,
            Longitude: reqValues.Longitude,
          };
          if (
            IsInsideTheRadius(
              treasureCoordinates,
              centerCoordinates,
              reqValues.Distance
            )
          ) {
            if (!reqValues.Prize) {
              response[responseCounter] = queryResult[index];
              responseCounter++;
            } else {
              if (queryResult[index].amt >= reqValues.Prize) {
                let checkDuplicate = false;
                for (let i = 0; i < response.length; i++) {
                  if (
                    response[i].treasure_id == queryResult[index].treasure_id
                  ) {
                    checkDuplicate = true;
                    if (response[i].amt > queryResult[index].amt) {
                      response[i] = queryResult[index];
                    }
                  }
                }
                if (!checkDuplicate) {
                  response[responseCounter] = queryResult[index];
                  responseCounter++;
                }
              }
            }
          }
        }
        res.send(response);
      })
      .catch((error) => {
        res.send(error);
      });
  } else {
    res.statusCode = 400;
    res.send("Invalid Request");
  }
}
app.use(bodyParser.json());
app.post("/geolocation", GetTreasure);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

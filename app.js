const express = require("express");
const app = express();

app.use(express.json());

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbpath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToResponseObjectForDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertDbObjectToResponseObjectForDistrictName = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

const convertDbObjectToResponseObjectForDistrictstatistics = (district) => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  };
};
//API 1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT *
    FROM state;`;
  const statesArray = await db.all(getStatesQuery);
  const results = statesArray.map((states) =>
    convertDbObjectToResponseObject(states)
  );
  response.send(results);
});

//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId};`;
  const statesArray = await db.get(getStatesQuery);
  const results = convertDbObjectToResponseObject(statesArray);
  response.send(results);
});

//API 3

app.post("/districts/", async (request, response) => {
  const districtsDetails = request.body;
  console.log(districtsDetails);
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtsDetails;
  const addDistrictsDetails = `
  INSERT INTO
    district (district_name , state_id , cases ,cured,active,deaths)
   VALUES('${districtName}' , ${stateId} , ${cases} , ${cured} , ${active} , ${deaths});
  `;
  const deResponse = await db.run(addDistrictsDetails);
  const movieId = deResponse.lastID;
  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};`;
  const districtArray = await db.get(getDistrictQuery);
  const results = convertDbObjectToResponseObjectForDistrict(districtArray);
  response.send(results);
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictDetails = `
  DELETE FROM district
  WHERE district_id = ${districtId}`;
  await db.run(deleteDistrictDetails);
  response.send("District Removed");
});

//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictDetails = `
  UPDATE district
    SET
    district_name = '${districtName}', 
    state_id =${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId};
  `;
  const deResponse = await db.run(updateDistrictDetails);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDistrictQuery = `
    SELECT
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM 
        district
    WHERE 
        state_id = ${stateId};`;
  const districtArray = await db.get(getDistrictQuery);
  response.send({
    totalCases: districtArray["SUM(cases)"],
    totalCured: districtArray["SUM(cured)"],
    totalActive: districtArray["SUM(active)"],
    totalDeaths: districtArray["SUM(deaths)"],
  });
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT state_name
    FROM state
    JOIN district
    ON state.state_id = district.state_id
    WHERE district_id = ${districtId};`;
  const districtArray = await db.get(getDistrictQuery);
  const results = convertDbObjectToResponseObjectForDistrictName(districtArray);
  response.send(results);
});

module.exports = app;

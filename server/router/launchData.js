const express = require("express");
const router = express.Router();
const cron = require("node-cron");

const Launch = require("../model/launchSchema");

cron.schedule("0 * * * *", async () => {
  try {
    // Find launches with past launch times and delete them from the database
    const result = await Launch.deleteMany({ net: { $lt: new Date() } });
    console.log(`Deleted ${result.deletedCount} launches from the database`);
  } catch (error) {
    console.error(`Error deleting launches from the database: ${error}`);
  }
});

router.get("/launches", async (req, res) => {
  try {
    const response = await fetch(process.env.REACT_APP_API_URL);
    const data = await response.json();

    const launchesToSave = data.results.map((launch) => {
      return {
        name: launch.name,
        net: new Date(launch.net),
        rocket: {
          name: launch.rocket.configuration.name,
        },
        launch_service_provider: {
          name: launch.launch_service_provider.name,
        },
        pad: {
          name: launch.pad.name,
          location: {
            name: launch.pad.location.name,
            country_code: launch.pad.location.country_code,
            map_image: launch.pad.location.map_image,
          },
        },
        mission: launch.mission && {
          name: launch.mission.name ? launch.mission.name : "NO",
          type: launch.mission.type,
        },
        image: launch.image ? launch.image : "Not found",
        webcast_live: launch.webcast_live ? launch.webcast_live : "Not Found",
      };
    });

    const savedLaunches = await Promise.all(
      launchesToSave.map((launchData) => {
        console.log(launchData);
        const newLaunch = new Launch(launchData);
        return newLaunch.save();
      })
    );

    console.log(`Saved ${savedLaunches.length} launches to the database`);

    res.json({ message: "Data inserted into MongoDB" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

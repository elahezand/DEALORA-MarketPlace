
const citiesData = require("../data/cities.json");

exports.getAll = async (req, res, next) => {
  try {
    const list = Object.entries(citiesData).map(([state, cities]) => ({
      state,
      cities,
    }));

    return res.status(200).json({
      cities: list, 
    });
  } catch (err) {
    return next(err);
  }
};
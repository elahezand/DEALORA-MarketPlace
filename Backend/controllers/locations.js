
const citiesData = require("../data/cities.json");

exports.getAll = async (req, res, next) => {
  try {
    const data = Object.entries(citiesData).map(([state, cities]) => ({
      state,
      cities,
    }));

    return res.status(200).json({
       data, 
    });
  } catch (err) {
    return next(err);
  }
};
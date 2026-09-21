const citiesData = require("../../data/cities.json");

const getAll = async (req, res, next) => {
  try {
    const data = Object.entries(citiesData).map(([state, cities]) => ({
      state,
      cities,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAll,
};

const { db, isArray, isEmpty, logError } = require("../util/helper");



exports.curency = async (req, res) => {
  try {
    
    var sql = "SELECT * FROM currency WHERE is_active = TRUE ";
   
    const [list] = await db.query(sql);
    res.json({
      list: list,
    });
  } catch (error) {
    logError("currency.getList", error, res);
  }
};

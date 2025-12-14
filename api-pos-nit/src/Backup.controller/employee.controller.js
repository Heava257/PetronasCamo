const { db, isArray, isEmpty, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const { txtSearch } = req.query;
    let sql = `
      SELECT 
        id,
        name,
        CASE 
          WHEN gender = 1 THEN 'Male'
          WHEN gender = 0 THEN 'Female'
        END AS gender,
        position,
        salary,
        tel,
        email,
        address,
        create_at
      FROM employee
    `;

    if (!isEmpty(txtSearch)) {
      sql +=
        " WHERE  name LIKE :txtSearch OR tel LIKE :txtSearch OR email LIKE :txtSearch";
    }

    const [list] = await db.query(sql, {
      txtSearch: `%${txtSearch}%`,
    });

    res.json({
      list,
    });
  } catch (error) {
    logError("employee.getList", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      name,
      position,
      salary,
      gender, // Expecting "Male" or "Female" from the frontend
      tel,
      email,
      code,
      address,
      website,
      note,
    } = req.body;

    // Convert gender from "Male"/"Female" to 1/0
    const genderValue = gender === "Male" ? 1 : 0;

    const sql = `
      INSERT INTO employee 
        (name, position, salary, gender, tel, email, code, address, website, note, create_by, create_at) 
      VALUES 
        (:name, :position, :salary, :gender, :tel, :email, :code, :address, :website, :note, :create_by, NOW())
    `;

    const [data] = await db.query(sql, {
      name,
      position,
      salary,
      gender: genderValue, // Use the converted value
      tel,
      email,
      code,
      address,
      website,
      note,
      create_by: req.auth?.name,
    });

    res.json({
      data,
      message: "Insert success!",
    });
  } catch (error) {
    logError("employee.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const {
      id,
      name,
      position,
      salary,
      gender, // Expecting "Male" or "Female" from the frontend
      code,
      tel,
      email,
      address,
      website,
      note,
    } = req.body;

    // Convert gender from "Male"/"Female" to 1/0
    const genderValue = gender === "Male" ? 1 : 0;

    const sql = `
      UPDATE employee 
      SET 
        name = :name, 
        position = :position, 
        salary = :salary, 
        gender = :gender, 
        code = :code, 
        tel = :tel, 
        email = :email, 
        address = :address, 
        website = :website, 
        note = :note 
      WHERE id = :id
    `;

    const [data] = await db.query(sql, {
      id,
      name,
      position,
      salary,
      gender: genderValue, // Use the converted value
      code,
      tel,
      email,
      address,
      website,
      note,
    });

    res.json({
      data,
      message: "Update success!",
    });
  } catch (error) {
    logError("employee.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.body;

    const [data] = await db.query("DELETE FROM employee WHERE id = :id", {
      id,
    });

    res.json({
      data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("employee.remove", error, res);
  }
};
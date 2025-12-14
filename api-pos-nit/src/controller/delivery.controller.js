// const { db, isArray, isEmpty, logError } = require("../util/helper");

// exports.getList = async (req, res) => {
//   try {
//     const sql = `
//         SELECT dn.*, 
//                c.name as customer_name,
//                u.name as created_by_name,
//                u.username as created_by_username,
//                (SELECT SUM(dni.amount) FROM delivery_note_items dni WHERE dni.delivery_note_id = dn.id) as total_amount
//         FROM delivery_note dn
//         LEFT JOIN customer c ON dn.customer_id = c.id
//         INNER JOIN user u ON dn.created_by = u.id
//         INNER JOIN user cu_user ON cu_user.group_id = u.group_id
//         WHERE cu_user.id = :current_user_id
//         ORDER BY dn.id DESC
//       `;
//     const [list] = await db.query(sql, { current_user_id: req.current_id });

//     res.json({ list });
//   } catch (error) {
//     logError("delivery-note.getList", error, res);
//   }
// };

// exports.getDetail = async (req, res) => {
//   try {
//     const deliveryNoteId = req.params.id;

//     // ✅ Check permission by group_id (similar to getList)
//     const checkSql = `
//         SELECT dn.*, 
//                c.name as customer_name,
//                u.name as created_by_name,
//                u.username as created_by_username
//         FROM delivery_note dn
//         LEFT JOIN customer c ON dn.customer_id = c.id
//         INNER JOIN user u ON dn.created_by = u.id
//         INNER JOIN user cu_user ON cu_user.group_id = u.group_id
//         WHERE dn.id = :id AND cu_user.id = :current_user_id
//       `;
//     const [rows] = await db.query(checkSql, {
//       id: deliveryNoteId,
//       current_user_id: req.current_id
//     });

//     if (rows.length === 0) {
//       return res.status(404).json({ message: "Not found or no permission." });
//     }

//     const deliveryNote = rows[0]; // ✅ includes all note details including order_number

//     const itemsSql = `
//         SELECT dni.*, c.name as category_name
//         FROM delivery_note_items dni
//         LEFT JOIN category c ON dni.category_id = c.id
//         WHERE dni.delivery_note_id = :deliveryNoteId
//       `;

//     const [items] = await db.query(itemsSql, { deliveryNoteId });

//     res.json({
//       note: deliveryNote, // ✅ includes order_number and customer info
//       items,
//     });
//   } catch (error) {
//     logError("delivery-note.getDetail", error, res);
//   }
// };

// exports.create = async (req, res) => {
//   try {
//     // Begin transaction
//     await db.query("START TRANSACTION");

//     // Insert into delivery_note table
//     const deliveryNoteSql = `
//   INSERT INTO delivery_note (
//   delivery_number, 
//   customer_id, 
//   delivery_date,
//   order_date,           -- ✅ NEW COLUMN
//   driver_name,
//   driver_phone,
//   vehicle_number,
//   note, 
//   top_tank_number,
//   bottom_tank_number,
//   order_number,
//   status, 
//   created_by
// )
// VALUES (
//   :delivery_number, 
//   :customer_id, 
//   :delivery_date,
//   :order_date,          -- ✅ NEW VALUE
//   :driver_name,
//   :driver_phone,
//   :vehicle_number, 
//   :note, 
//   :top_tank_number,
//   :bottom_tank_number,
//   :order_number,  
//   :status, 
//   :created_by
// )
// `;

//     const [deliveryNote] = await db.query(deliveryNoteSql, {
//       delivery_number: req.body.delivery_number,
//       customer_id: req.body.customer_id,
//       delivery_date: req.body.delivery_date,
//       order_date: req.body.order_date || null,
//       driver_name: req.body.driver_name,
//       driver_phone: req.body.driver_phone,
//       vehicle_number: req.body.vehicle_number,
//       note: req.body.note,
//       top_tank_number: req.body.top_tank_number || null,
//       bottom_tank_number: req.body.bottom_tank_number || null,
//       order_number: req.body.order_number || null,
//       status: req.body.status,
//       created_by: req.current_id,
//     });

//     const deliveryNoteId = deliveryNote.insertId;

//     // Insert items if they exist
//     if (req.body.items && req.body.items.length > 0) {
//       for (const item of req.body.items) {
//         const itemSql = `
//           INSERT INTO delivery_note_items (
//             delivery_note_id,
//             category_id,
//             quantity,
//             unit,
//             unit_price,
//             amount
//           ) VALUES (
//             :delivery_note_id,
//             :category_id,
//             :quantity,
//             :unit,
//             :unit_price,
//             :amount
//           )
//         `;

//         await db.query(itemSql, {
//           delivery_note_id: deliveryNoteId,
//           category_id: item.category_id,
//           quantity: item.quantity,
//           unit: item.unit,
//           unit_price: item.unit_price,
//           amount: item.amount,
//         });
//       }
//     }

//     // Commit transaction
//     await db.query("COMMIT");

//     res.json({
//       data: { id: deliveryNoteId },
//       message: "Delivery note created successfully!",
//     });
//   } catch (error) {
//     // Rollback transaction in case of error
//     await db.query("ROLLBACK");
//     logError("delivery-note.create", error, res);
//   }
// };

// exports.update = async (req, res) => {
//   try {
//     const deliveryNoteId = req.body.id;

//     // 1. Check permission first
//     const checkSql = `
//         SELECT id FROM delivery_note 
//         WHERE id = :id AND created_by = :created_by
//       `;
//     const [rows] = await db.query(checkSql, { id: deliveryNoteId, created_by: req.current_id });

//     if (rows.length === 0) {
//       return res.status(404).json({ message: "Not found or no permission." });
//     }

//     // 2. Start transaction
//     await db.query("START TRANSACTION");

//     // Update delivery_note table
//     const updateSql = `
//       UPDATE delivery_note SET 
//         delivery_number = :delivery_number,
//         customer_id = :customer_id,
//         delivery_date = :delivery_date,
//         driver_name = :driver_name,
//         driver_phone = :driver_phone,
//         vehicle_number = :vehicle_number,
//         note = :note,
//         top_tank_number = :top_tank_number,
//         bottom_tank_number = :bottom_tank_number,
//         order_number = :order_number,  -- ✅ Add this line
//         status = :status,
//         updated_at = CURRENT_TIMESTAMP,
//         updated_by = :updated_by
//       WHERE id = :id
//     `;

//     await db.query(updateSql, {
//       id: deliveryNoteId,
//       delivery_number: req.body.delivery_number,
//       customer_id: req.body.customer_id,
//       delivery_date: req.body.delivery_date,
//       driver_name: req.body.driver_name,
//       driver_phone: req.body.driver_phone,
//       vehicle_number: req.body.vehicle_number,
//       note: req.body.note,
//       top_tank_number: req.body.top_tank_number || null,
//       bottom_tank_number: req.body.bottom_tank_number || null,
//       order_number: req.body.order_number || null,
//       status: req.body.status,
//       updated_by: req.current_id,
//     });

//     // Delete and Re-insert items
//     await db.query("DELETE FROM delivery_note_items WHERE delivery_note_id = :delivery_note_id", {
//       delivery_note_id: deliveryNoteId,
//     });

//     if (req.body.items && req.body.items.length > 0) {
//       for (const item of req.body.items) {
//         const itemSql = `
//             INSERT INTO delivery_note_items (
//               delivery_note_id,
//               category_id,
//               quantity,
//               unit,
//               unit_price,
//               amount
//             ) VALUES (
//               :delivery_note_id,
//               :category_id,
//               :quantity,
//               :unit,
//               :unit_price,
//               :amount
//             )
//           `;
//         await db.query(itemSql, {
//           delivery_note_id: deliveryNoteId,
//           category_id: item.category_id,
//           quantity: item.quantity,
//           unit: item.unit,
//           unit_price: item.unit_price,
//           amount: item.amount,
//         });
//       }
//     }

//     await db.query("COMMIT");
//     res.json({ message: "Delivery note updated successfully!" });

//   } catch (error) {
//     await db.query("ROLLBACK");
//     logError("delivery-note.update", error, res);
//   }
// };

// exports.remove = async (req, res) => {
//   try {
//     const deliveryNoteId = req.body.id;

//     // Check permission
//     const checkSql = `
//         SELECT id FROM delivery_note 
//         WHERE id = :id AND created_by = :created_by
//       `;
//     const [rows] = await db.query(checkSql, {
//       id: deliveryNoteId,
//       created_by: req.current_id
//     });

//     if (rows.length === 0) {
//       return res.status(404).json({ message: "Not found or no permission." });
//     }

//     await db.query("START TRANSACTION");

//     await db.query("DELETE FROM delivery_note_items WHERE delivery_note_id = :id", {
//       id: deliveryNoteId,
//     });

//     const [data] = await db.query("DELETE FROM delivery_note WHERE id = :id", {
//       id: deliveryNoteId,
//     });

//     await db.query("COMMIT");

//     res.json({
//       data,
//       message: "Delivery note deleted successfully!",
//     });
//   } catch (error) {
//     await db.query("ROLLBACK");
//     logError("delivery-note.remove", error, res);
//   }
// };


const { db, isArray, isEmpty, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const sql = `
       SELECT dn.*, 
       dn.created_by,      -- ✅ Explicitly select it for clarity
       c.name as customer_name,
       u.name as created_by_name,
       u.username as created_by_username,
       (SELECT SUM(dni.amount) FROM delivery_note_items dni WHERE dni.delivery_note_id = dn.id) as total_amount
FROM delivery_note dn
LEFT JOIN customer c ON dn.customer_id = c.id
INNER JOIN user u ON dn.created_by = u.id
INNER JOIN user cu_user ON cu_user.group_id = u.group_id
WHERE cu_user.id = :current_user_id
ORDER BY dn.id DESC

      `;
    const [list] = await db.query(sql, { current_user_id: req.current_id });

    res.json({ list });
  } catch (error) {
    logError("delivery-note.getList", error, res);
  }
};

exports.getDetail = async (req, res) => {
  try {
    const deliveryNoteId = req.params.id;


    // Simplified permission check - first check if the note exists
    const noteSql = `
       SELECT dn.*, 
       c.name as customer_name,
       c.tel as customer_phone,
       c.address as customer_address,
       u.name as created_by_name,
       u.username as created_by_username
FROM delivery_note dn
LEFT JOIN customer c ON dn.customer_id = c.id
LEFT JOIN user u ON dn.created_by = u.id

      `;
    const [noteRows] = await db.query(noteSql, { id: deliveryNoteId });

    if (noteRows.length === 0) {
      return res.status(404).json({ message: "Delivery note not found." });
    }

    const deliveryNote = noteRows[0];

    // Check permission by group (if needed)
    const permissionSql = `
        SELECT 1 FROM user u1
        INNER JOIN user u2 ON u1.group_id = u2.group_id
        WHERE u1.id = :created_by AND u2.id = :current_user_id
      `;
    const [permissionRows] = await db.query(permissionSql, {
      created_by: deliveryNote.created_by,
      current_user_id: req.current_id
    });

    if (permissionRows.length === 0) {
      return res.status(403).json({ message: "No permission to access this delivery note." });
    }

    // Fetch items
    const itemsSql = `
        SELECT dni.*, 
               c.name as category_name,
               dni.description
        FROM delivery_note_items dni
        LEFT JOIN category c ON dni.category_id = c.id
        WHERE dni.delivery_note_id = :deliveryNoteId
        ORDER BY dni.id
      `;

    const [items] = await db.query(itemsSql, { deliveryNoteId });


    res.json({
      note: deliveryNote,
      items: items || [],
    });

  } catch (error) {
    console.error("Error in getDetail:", error);
    logError("delivery-note.getDetail", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    // Begin transaction
    await db.query("START TRANSACTION");

    // Insert into delivery_note table
    const deliveryNoteSql = `
      INSERT INTO delivery_note (
        delivery_number, 
        customer_id, 
        delivery_date,
        order_date,
        driver_name,
        driver_phone,
        vehicle_number,
        note, 
        top_tank_number,
        bottom_tank_number,
        order_number,
        status, 
        created_by
      )
      VALUES (
        :delivery_number, 
        :customer_id, 
        :delivery_date,
        :order_date,
        :driver_name,
        :driver_phone,
        :vehicle_number, 
        :note, 
        :top_tank_number,
        :bottom_tank_number,
        :order_number,  
        :status, 
        :created_by
      )
    `;

    const [deliveryNote] = await db.query(deliveryNoteSql, {
      delivery_number: req.body.delivery_number,
      customer_id: req.body.customer_id,
      delivery_date: req.body.delivery_date,
      order_date: req.body.order_date || null,
      driver_name: req.body.driver_name,
      driver_phone: req.body.driver_phone,
      vehicle_number: req.body.vehicle_number,
      note: req.body.note,
      top_tank_number: req.body.top_tank_number || null,
      bottom_tank_number: req.body.bottom_tank_number || null,
      order_number: req.body.order_number || null,
      status: req.body.status,
      created_by: req.current_id,
    });

    const deliveryNoteId = deliveryNote.insertId;

    // Insert items if they exist
    if (req.body.items && req.body.items.length > 0) {
      for (const item of req.body.items) {
        const itemSql = `
          INSERT INTO delivery_note_items (
            delivery_note_id,
            category_id,
            description,
            quantity,
            unit,
            unit_price,
            amount
          ) VALUES (
            :delivery_note_id,
            :category_id,
            :description,
            :quantity,
            :unit,
            :unit_price,
            :amount
          )
        `;

        await db.query(itemSql, {
          delivery_note_id: deliveryNoteId,
          category_id: item.category_id,
          description: item.description || "",
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          amount: item.amount,
        });
      }
    }

    // Commit transaction
    await db.query("COMMIT");

    res.json({
      data: { id: deliveryNoteId },
      message: "Delivery note created successfully!",
    });
  } catch (error) {
    // Rollback transaction in case of error
    await db.query("ROLLBACK");
    logError("delivery-note.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const deliveryNoteId = req.body.id;

    // Check permission first
    const checkSql = `
        SELECT dn.id FROM delivery_note dn
        INNER JOIN user u1 ON dn.created_by = u1.id
        INNER JOIN user u2 ON u1.group_id = u2.group_id
        WHERE dn.id = :id AND u2.id = :current_user_id
      `;
    const [rows] = await db.query(checkSql, { 
      id: deliveryNoteId, 
      current_user_id: req.current_id 
    });

    if (rows.length === 0) {
      return res.status(404).json({ message: "Not found or no permission." });
    }

    // Start transaction
    await db.query("START TRANSACTION");

    // Update delivery_note table
    const updateSql = `
      UPDATE delivery_note SET 
        delivery_number = :delivery_number,
        customer_id = :customer_id,
        delivery_date = :delivery_date,
        order_date = :order_date,
        driver_name = :driver_name,
        driver_phone = :driver_phone,
        vehicle_number = :vehicle_number,
        note = :note,
        top_tank_number = :top_tank_number,
        bottom_tank_number = :bottom_tank_number,
        order_number = :order_number,
        status = :status,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = :updated_by
      WHERE id = :id
    `;

    await db.query(updateSql, {
      id: deliveryNoteId,
      delivery_number: req.body.delivery_number,
      customer_id: req.body.customer_id,
      delivery_date: req.body.delivery_date,
      order_date: req.body.order_date || null,
      driver_name: req.body.driver_name,
      driver_phone: req.body.driver_phone,
      vehicle_number: req.body.vehicle_number,
      note: req.body.note,
      top_tank_number: req.body.top_tank_number || null,
      bottom_tank_number: req.body.bottom_tank_number || null,
      order_number: req.body.order_number || null,
      status: req.body.status,
      updated_by: req.current_id,
    });

    // Delete and Re-insert items
    await db.query("DELETE FROM delivery_note_items WHERE delivery_note_id = :delivery_note_id", {
      delivery_note_id: deliveryNoteId,
    });

    if (req.body.items && req.body.items.length > 0) {
      for (const item of req.body.items) {
        const itemSql = `
            INSERT INTO delivery_note_items (
              delivery_note_id,
              category_id,
              description,
              quantity,
              unit,
              unit_price,
              amount
            ) VALUES (
              :delivery_note_id,
              :category_id,
              :description,
              :quantity,
              :unit,
              :unit_price,
              :amount
            )
          `;
        await db.query(itemSql, {
          delivery_note_id: deliveryNoteId,
          category_id: item.category_id,
          description: item.description || "",
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          amount: item.amount,
        });
      }
    }

    await db.query("COMMIT");
    res.json({ message: "Delivery note updated successfully!" });

  } catch (error) {
    await db.query("ROLLBACK");
    logError("delivery-note.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const deliveryNoteId = req.body.id;

    // Check permission
    const checkSql = `
        SELECT dn.id FROM delivery_note dn
        INNER JOIN user u1 ON dn.created_by = u1.id
        INNER JOIN user u2 ON u1.group_id = u2.group_id
        WHERE dn.id = :id AND u2.id = :current_user_id
      `;
    const [rows] = await db.query(checkSql, {
      id: deliveryNoteId,
      current_user_id: req.current_id
    });

    if (rows.length === 0) {
      return res.status(404).json({ message: "Not found or no permission." });
    }

    await db.query("START TRANSACTION");

    await db.query("DELETE FROM delivery_note_items WHERE delivery_note_id = :id", {
      id: deliveryNoteId,
    });

    const [data] = await db.query("DELETE FROM delivery_note WHERE id = :id", {
      id: deliveryNoteId,
    });

    await db.query("COMMIT");

    res.json({
      data,
      message: "Delivery note deleted successfully!",
    });
  } catch (error) {
    await db.query("ROLLBACK");
    logError("delivery-note.remove", error, res);
  }
};

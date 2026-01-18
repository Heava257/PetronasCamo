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
exports.getDeliveryPerformanceReport = async (req, res) => {
  try {
    const { start_date, end_date, driver_id } = req.query;

    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);

    if (!currentUser.length) return res.status(401).json({ error: "User not found" });
    const { role_id, branch_name } = currentUser[0];
    const isSuperAdmin = role_id === 29;

    let sql = `
      SELECT 
        DATE(o.delivery_date) as delivery_date,
        COUNT(*) as total_deliveries,
        SUM(CASE WHEN o.delivery_status = 'delivered' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN o.delivery_status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
        SUM(CASE WHEN o.delivery_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN o.delivery_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        ROUND((SUM(CASE WHEN o.delivery_status = 'delivered' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as completion_rate,
        COUNT(DISTINCT o.driver_id) as drivers
      FROM \`order\` o
      LEFT JOIN user u_creator ON o.user_id = u_creator.id
      WHERE o.delivery_date IS NOT NULL
    `;

    const params = {};

    if (!isSuperAdmin) {
      sql += ` AND u_creator.branch_name = :branch_name`;
      params.branch_name = branch_name;
    }

    if (start_date) {
      sql += ` AND o.delivery_date >= :start_date`;
      params.start_date = start_date;
    }

    if (end_date) {
      sql += ` AND o.delivery_date <= :end_date`;
      params.end_date = end_date;
    }

    if (driver_id) {
      sql += ` AND o.driver_id = :driver_id`;
      params.driver_id = driver_id;
    }

    sql += ` GROUP BY DATE(o.delivery_date) ORDER BY delivery_date DESC`;

    const [performance] = await db.query(sql, params);

    // Summary query remains the same
    // Summary query with branch filtering
    const summarySql = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN o.delivery_status = 'delivered' THEN 1 ELSE 0 END) as total_completed,
        SUM(CASE WHEN o.delivery_status = 'in_transit' THEN 1 ELSE 0 END) as total_in_transit,
        SUM(CASE WHEN o.delivery_status = 'pending' THEN 1 ELSE 0 END) as total_pending,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, o.order_date, o.actual_delivery_time))) as avg_delivery_minutes
      FROM \`order\` o
      LEFT JOIN user u_creator ON o.user_id = u_creator.id
      WHERE o.delivery_date IS NOT NULL
        ${start_date ? 'AND o.delivery_date >= :start_date' : ''}
        ${end_date ? 'AND o.delivery_date <= :end_date' : ''}
        ${driver_id ? 'AND o.driver_id = :driver_id' : ''}
        ${!isSuperAdmin ? 'AND u_creator.branch_name = :branch_name' : ''}
    `;

    const [summary] = await db.query(summarySql, params);

    res.json({
      success: true,
      performance,
      summary: summary[0] || {},
      period: { start_date, end_date }
    });

  } catch (error) {
    logError("delivery.getDeliveryPerformanceReport", error, res);
  }
};
exports.getVehicleUtilizationReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);
    const { role_id, branch_name } = currentUser[0] || {};
    const isSuperAdmin = role_id === 29;

    const sql = `
      SELECT 
        t.id,
        t.plate_number,
        t.truck_type,
        t.capacity_liters,
        t.driver_name,
        t.driver_phone,
        COUNT(DISTINCT dn.id) as total_deliveries,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(CASE WHEN dn.delivery_status = 'delivered' THEN 1 ELSE 0 END) as completed_deliveries,
        MIN(dn.delivery_date) as first_assignment_date,
        MAX(dn.delivery_date) as last_assignment_date,
        ROUND(COUNT(DISTINCT dn.id) / NULLIF(DATEDIFF(MAX(dn.delivery_date), MIN(dn.delivery_date)) + 1, 0), 2) as avg_deliveries_per_day
      FROM trucks t
      LEFT JOIN delivery_note dn ON t.id = dn.truck_id
        ${start_date ? 'AND dn.delivery_date >= :start_date' : ''}
        ${end_date ? 'AND dn.delivery_date <= :end_date' : ''}
        ${!isSuperAdmin ? 'AND dn.created_by IN (SELECT id FROM user WHERE branch_name = :branch_name)' : ''}
      LEFT JOIN \`order\` o ON t.id = o.truck_id
        ${start_date ? 'AND o.delivery_date >= :start_date' : ''}
        ${end_date ? 'AND o.delivery_date <= :end_date' : ''}
        ${!isSuperAdmin ? 'AND o.user_id IN (SELECT id FROM user WHERE branch_name = :branch_name)' : ''}
      WHERE t.status = 'active'
      GROUP BY t.id, t.plate_number, t.truck_type, t.capacity_liters, t.driver_name, t.driver_phone
      ORDER BY total_deliveries DESC
    `;

    const [vehicles] = await db.query(sql, { start_date, end_date, branch_name });

    // Get maintenance summary
    const maintenanceSql = `
      SELECT 
        truck_id,
        COUNT(*) as maintenance_count,
        SUM(cost) as total_maintenance_cost,
        MAX(performed_at) as last_maintenance,
        MAX(next_due_date) as next_maintenance_due
      FROM vehicle_maintenance
      WHERE 1=1
        ${start_date ? 'AND performed_at >= :start_date' : ''}
        ${end_date ? 'AND performed_at <= :end_date' : ''}
      GROUP BY truck_id
    `;

    const [maintenance] = await db.query(maintenanceSql, { start_date, end_date });

    // Combine data
    const result = vehicles.map(vehicle => {
      const vehicleMaintenance = maintenance.find(m => m.truck_id === vehicle.id) || {};
      return {
        ...vehicle,
        maintenance: vehicleMaintenance
      };
    });

    res.json({
      success: true,
      vehicles: result,
      total_vehicles: vehicles.length,
      period: { start_date, end_date }
    });

  } catch (error) {
    logError("delivery.getVehicleUtilizationReport", error, res);
  }
};

exports.getDriverPerformanceReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);
    const { role_id, branch_name } = currentUser[0] || {};
    const isSuperAdmin = role_id === 29;

    let sql = `
      SELECT 
        t.driver_name,
        t.driver_phone,
        t.plate_number,
        COUNT(o.id) as total_deliveries,
        SUM(CASE WHEN o.delivery_status = 'delivered' THEN 1 ELSE 0 END) as completed_deliveries,
        SUM(CASE WHEN o.delivery_status = 'pending' THEN 1 ELSE 0 END) as pending_deliveries,
        SUM(CASE WHEN o.delivery_status = 'in_transit' THEN 1 ELSE 0 END) as in_transit_deliveries,
        ROUND((SUM(CASE WHEN o.delivery_status = 'delivered' THEN 1 ELSE 0 END) / COUNT(o.id)) * 100, 2) as completion_rate
      FROM trucks t
      LEFT JOIN \`order\` o ON t.id = o.truck_id
      LEFT JOIN user u_creator ON o.user_id = u_creator.id
      WHERE t.driver_name IS NOT NULL
    `;

    const params = {};

    if (!isSuperAdmin) {
      sql += ` AND u_creator.branch_name = :branch_name`;
      params.branch_name = branch_name;
    }

    if (start_date) {
      sql += ` AND o.delivery_date >= :start_date`;
      params.start_date = start_date;
    }

    if (end_date) {
      sql += ` AND o.delivery_date <= :end_date`;
      params.end_date = end_date;
    }

    sql += ` 
      GROUP BY t.driver_name, t.driver_phone, t.plate_number 
      HAVING total_deliveries > 0
      ORDER BY total_deliveries DESC
    `;

    const [drivers] = await db.query(sql, params);

    res.json({
      success: true,
      drivers,
      total_drivers: drivers.length,
      period: { start_date, end_date }
    });

  } catch (error) {
    console.error('Driver performance error:', error);
    logError("delivery.getDriverPerformanceReport", error, res);
  }
};
exports.getDeliveryStats = async (req, res) => {
  try {
    const { period = 'today' } = req.query; // today, week, month, year, custom

    let dateFilter = '';
    const params = {};

    switch (period) {
      case 'today':
        dateFilter = 'AND DATE(o.delivery_date) = CURDATE()';
        break;
      case 'week':
        dateFilter = 'AND YEARWEEK(o.delivery_date) = YEARWEEK(CURDATE())';
        break;
      case 'month':
        dateFilter = 'AND YEAR(o.delivery_date) = YEAR(CURDATE()) AND MONTH(o.delivery_date) = MONTH(CURDATE())';
        break;
      case 'year':
        dateFilter = 'AND YEAR(o.delivery_date) = YEAR(CURDATE())';
        break;
      default:
        // Custom date range
        const { start_date, end_date } = req.query;
        if (start_date && end_date) {
          dateFilter = 'AND DATE(o.delivery_date) BETWEEN :start_date AND :end_date';
          params.start_date = start_date;
          params.end_date = end_date;
        }
    }

    const sql = `
      SELECT 
        -- Status counts
        COUNT(*) as total_orders,
        SUM(CASE WHEN o.delivery_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN o.delivery_status = 'in_transit' THEN 1 ELSE 0 END) as in_transit_orders,
        SUM(CASE WHEN o.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN o.delivery_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        
        -- Amounts
        SUM(o.total_amount) as total_amount,
        SUM(CASE WHEN o.delivery_status = 'delivered' THEN o.total_amount ELSE 0 END) as delivered_amount,
        SUM(CASE WHEN o.delivery_status = 'pending' THEN o.total_amount ELSE 0 END) as pending_amount,
        
        -- Delivery performance
        ROUND((SUM(CASE WHEN o.delivery_status = 'delivered' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as delivery_completion_rate,
        
        -- Truck utilization
        COUNT(DISTINCT o.truck_id) as active_trucks,
        COUNT(DISTINCT o.driver_id) as active_drivers,
        
        -- Time metrics
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, o.order_date, o.actual_delivery_date))) as avg_delivery_time_minutes
        
      FROM \`order\` o
      WHERE 1=1 ${dateFilter}
        AND o.user_id IN (SELECT id FROM user WHERE group_id = (SELECT group_id FROM user WHERE id = :current_user_id))
    `;

    params.current_user_id = req.current_id;

    const [stats] = await db.query(sql, params);

    // Get today's delivery schedule
    const scheduleSql = `
      SELECT 
        COUNT(*) as scheduled_today,
        SUM(CASE WHEN o.delivery_status = 'pending' THEN 1 ELSE 0 END) as pending_today,
        SUM(CASE WHEN o.delivery_status = 'in_transit' THEN 1 ELSE 0 END) as in_transit_today,
        SUM(CASE WHEN o.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered_today
      FROM \`order\` o
      WHERE DATE(o.delivery_date) = CURDATE()
        AND o.user_id IN (SELECT id FROM user WHERE group_id = (SELECT group_id FROM user WHERE id = :current_user_id))
    `;

    const [todayStats] = await db.query(scheduleSql, { current_user_id: req.current_id });

    res.json({
      success: true,
      stats: stats[0] || {},
      today_stats: todayStats[0] || {},
      period
    });

  } catch (error) {
    logError("delivery.getDeliveryStats", error, res);
  }
};

/**
 * Get today's deliveries
 */
exports.getDeliveriesToday = async (req, res) => {
  try {
    const { status, driver_id, truck_id } = req.query;

    let sql = `
      SELECT 
        o.id,
        o.order_no,
        o.customer_id,
        c.name as customer_name,
        c.tel as customer_phone,
        o.location_id,
        cl.location_name,
        cl.address as delivery_address,
        cl.latitude,
        cl.longitude,
        o.truck_id,
        t.plate_number,
        t.driver_name as assigned_driver,
        t.driver_phone as driver_phone,
        o.delivery_status,
        o.order_date,
        o.delivery_date,
        o.actual_delivery_date,
        o.total_amount,
        o.paid_amount,
        (o.total_amount - o.paid_amount) as balance,
        TIME_FORMAT(TIMEDIFF(o.delivery_date, NOW()), '%H:%i') as time_remaining,
        
        -- Latest tracking info
        (SELECT status FROM delivery_tracking dt WHERE dt.order_id = o.id ORDER BY timestamp DESC LIMIT 1) as latest_tracking_status,
        (SELECT timestamp FROM delivery_tracking dt WHERE dt.order_id = o.id ORDER BY timestamp DESC LIMIT 1) as latest_tracking_time
        
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN customer_locations cl ON o.location_id = cl.id
      LEFT JOIN trucks t ON o.truck_id = t.id
      WHERE DATE(o.delivery_date) = CURDATE()
        AND o.user_id IN (SELECT id FROM user WHERE group_id = (SELECT group_id FROM user WHERE id = :current_user_id))
    `;

    const params = { current_user_id: req.current_id };

    if (status) {
      sql += ` AND o.delivery_status = :status`;
      params.status = status;
    }

    if (driver_id) {
      sql += ` AND o.driver_id = :driver_id`;
      params.driver_id = driver_id;
    }

    if (truck_id) {
      sql += ` AND o.truck_id = :truck_id`;
      params.truck_id = truck_id;
    }

    sql += ` ORDER BY o.delivery_date ASC, FIELD(o.delivery_status, 'pending', 'in_transit', 'delivered', 'cancelled')`;

    const [deliveries] = await db.query(sql, params);

    // Get summary for today
    const summarySql = `
      SELECT 
        COUNT(*) as total_today,
        SUM(CASE WHEN delivery_status = 'pending' THEN 1 ELSE 0 END) as pending_today,
        SUM(CASE WHEN delivery_status = 'in_transit' THEN 1 ELSE 0 END) as in_transit_today,
        SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered_today,
        SUM(CASE WHEN delivery_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_today
      FROM \`order\`
      WHERE DATE(delivery_date) = CURDATE()
        AND user_id IN (SELECT id FROM user WHERE group_id = (SELECT group_id FROM user WHERE id = :current_user_id))
    `;

    const [summary] = await db.query(summarySql, { current_user_id: req.current_id });

    res.json({
      success: true,
      deliveries,
      summary: summary[0] || {},
      total: deliveries.length
    });

  } catch (error) {
    logError("delivery.getDeliveriesToday", error, res);
  }
};

/**
 * Get delivery note details
 */
exports.getDeliveryNoteDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        dn.*,
        c.name as customer_name,
        c.tel as customer_phone,
        c.address as customer_address,
        cl.location_name,
        cl.address as delivery_address,
        cl.latitude,
        cl.longitude,
        t.plate_number,
        t.driver_name as truck_driver,
        t.driver_phone as truck_driver_phone,
        u1.name as created_by_name,
        u2.name as updated_by_name,
        
        -- Order details if linked
        o.order_no,
        o.total_amount as order_total,
        o.paid_amount as order_paid,
        (o.total_amount - o.paid_amount) as order_balance
        
      FROM delivery_note dn
      LEFT JOIN customer c ON dn.customer_id = c.id
      LEFT JOIN customer_locations cl ON dn.location_id = cl.id
      LEFT JOIN trucks t ON dn.truck_id = t.id
      LEFT JOIN user u1 ON dn.created_by = u1.id
      LEFT JOIN user u2 ON dn.updated_by = u2.id
      LEFT JOIN \`order\` o ON dn.order_number = o.order_no
      WHERE dn.id = :id
        AND dn.created_by IN (SELECT id FROM user WHERE group_id = (SELECT group_id FROM user WHERE id = :current_user_id))
    `;

    const [note] = await db.query(sql, {
      id,
      current_user_id: req.current_id
    });

    if (note.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Delivery note not found or no permission"
      });
    }

    // Get delivery note items
    const itemsSql = `
      SELECT 
        dni.*,
        c.name as category_name
      FROM delivery_note_items dni
      LEFT JOIN category c ON dni.category_id = c.id
      WHERE dni.delivery_note_id = :delivery_note_id
      ORDER BY dni.id
    `;

    const [items] = await db.query(itemsSql, { delivery_note_id: id });

    // Get delivery tracking for this note
    const trackingSql = `
      SELECT 
        dt.*,
        u.name as created_by_name,
        DATE_FORMAT(dt.timestamp, '%Y-%m-%d %H:%i:%s') as formatted_time
      FROM delivery_tracking dt
      LEFT JOIN user u ON dt.created_by = u.id
      WHERE dt.delivery_note_id = :delivery_note_id
      ORDER BY dt.timestamp ASC
    `;

    const [tracking] = await db.query(trackingSql, { delivery_note_id: id });

    res.json({
      success: true,
      note: note[0],
      items,
      tracking,
      total_items: items.length,
      total_tracking: tracking.length
    });

  } catch (error) {
    logError("delivery.getDeliveryNoteDetail", error, res);
  }
};

// ============================================
// DELIVERY TRACKING
// ============================================

/**
 * Get active deliveries (in progress)
 */
exports.getActiveDeliveries = async (req, res) => {
  try {
    const { driver_id, truck_id } = req.query;

    let sql = `
      SELECT 
        o.id as order_id,
        o.order_no,
        o.customer_id,
        c.name as customer_name,
        c.tel as customer_phone,
        o.location_id,
        cl.location_name,
        cl.address as delivery_address,
        cl.latitude,
        cl.longitude,
        o.truck_id,
        t.plate_number,
        t.driver_name as assigned_driver,
        t.driver_phone as driver_phone,
        o.delivery_status,
        o.order_date,
        o.delivery_date,
        o.actual_delivery_date,
        o.total_amount,
        
        -- Latest tracking info
        dt1.status as latest_status,
        dt1.latitude as latest_latitude,
        dt1.longitude as latest_longitude,
        dt1.timestamp as latest_tracking_time,
        dt1.notes as latest_notes,
        
        -- Driver location (if available)
        d.current_location_lat as driver_latitude,
        d.current_location_lng as driver_longitude,
        d.last_updated as driver_location_updated,
        
        -- Calculate distance to destination
        ROUND(111.045 * DEGREES(ACOS(COS(RADIANS(d.current_location_lat)) 
              * COS(RADIANS(cl.latitude)) 
              * COS(RADIANS(d.current_location_lng - cl.longitude)) 
              + SIN(RADIANS(d.current_location_lat)) 
              * SIN(RADIANS(cl.latitude)))), 2) as distance_km
        
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN customer_locations cl ON o.location_id = cl.id
      LEFT JOIN trucks t ON o.truck_id = t.id
      LEFT JOIN (
        SELECT order_id, status, latitude, longitude, timestamp, notes
        FROM delivery_tracking
        WHERE (order_id, timestamp) IN (
          SELECT order_id, MAX(timestamp)
          FROM delivery_tracking
          GROUP BY order_id
        )
      ) dt1 ON o.id = dt1.order_id
      LEFT JOIN drivers d ON o.driver_id = d.user_id
      WHERE o.delivery_status IN ('in_transit', 'pending')
        AND o.user_id IN (SELECT id FROM user WHERE group_id = (SELECT group_id FROM user WHERE id = :current_user_id))
    `;

    const params = { current_user_id: req.current_id };

    if (driver_id) {
      sql += ` AND o.driver_id = :driver_id`;
      params.driver_id = driver_id;
    }

    if (truck_id) {
      sql += ` AND o.truck_id = :truck_id`;
      params.truck_id = truck_id;
    }

    sql += ` ORDER BY o.delivery_status, o.delivery_date ASC`;

    const [activeDeliveries] = await db.query(sql, params);

    res.json({
      success: true,
      active_deliveries: activeDeliveries,
      total_active: activeDeliveries.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError("delivery.getActiveDeliveries", error, res);
  }
};

/**
 * Assign truck to order
 */

exports.assignTruckToOrder = async (req, res) => {
  try {
    const { order_id, truck_id, driver_id } = req.body;

    await db.query("START TRANSACTION");

    // Check order permission
    const checkSql = `
      SELECT o.id 
      FROM \`order\` o
      INNER JOIN user u ON o.user_id = u.id
      WHERE o.id = :order_id
        AND u.group_id = (SELECT group_id FROM user WHERE id = :current_user_id)
    `;

    const [check] = await db.query(checkSql, {
      order_id,
      current_user_id: req.current_id
    });

    if (check.length === 0) {
      await db.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "No permission to update this order"
      });
    }

    // Update order
    const updateSql = `
      UPDATE \`order\` 
      SET truck_id = :truck_id,
          driver_id = :driver_id,
          delivery_status = 'in_transit',
          updated_at = NOW()
      WHERE id = :order_id
    `;

    await db.query(updateSql, {
      order_id,
      truck_id,
      driver_id
    });

    // Create delivery tracking record
    const trackingSql = `
      INSERT INTO delivery_tracking 
        (order_id, truck_id, status, notes, created_by)
      VALUES (:order_id, :truck_id, 'in_transit', 'Truck assigned to order', :created_by)
    `;

    await db.query(trackingSql, {
      order_id,
      truck_id,
      created_by: req.current_id
    });

    // Update truck status if needed
    const truckSql = `
      UPDATE trucks 
      SET status = 'on_delivery',
          updated_at = NOW()
      WHERE id = :truck_id
    `;

    await db.query(truckSql, { truck_id });

    await db.query("COMMIT");

    res.json({
      success: true,
      message: "Truck assigned successfully",
      data: {
        order_id,
        truck_id,
        driver_id,
        assigned_at: new Date().toISOString()
      }
    });

  } catch (error) {
    await db.query("ROLLBACK");
    logError("delivery.assignTruckToOrder", error, res);
  }
};

/**
 * Update delivery status
 */
exports.updateOrderDeliveryStatus = async (req, res) => {
  try {
    const { order_id, status, latitude, longitude, notes } = req.body;

    await db.query("START TRANSACTION");

    // Check order permission
    const checkSql = `
      SELECT o.id, o.delivery_status
      FROM \`order\` o
      INNER JOIN user u ON o.user_id = u.id
      WHERE o.id = :order_id
        AND u.group_id = (SELECT group_id FROM user WHERE id = :current_user_id)
    `;

    const [check] = await db.query(checkSql, {
      order_id,
      current_user_id: req.current_id
    });

    if (check.length === 0) {
      await db.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "No permission to update this order"
      });
    }

    // Update order status
    const updateSql = `
      UPDATE \`order\` 
      SET delivery_status = :status,
          ${status === 'delivered' ? 'actual_delivery_date = NOW(), ' : ''}
          updated_at = NOW()
      WHERE id = :order_id
    `;

    await db.query(updateSql, {
      order_id,
      status
    });

    // Create tracking record
    const trackingSql = `
      INSERT INTO delivery_tracking 
        (order_id, status, latitude, longitude, notes, created_by)
      VALUES (:order_id, :status, :latitude, :longitude, :notes, :created_by)
    `;

    await db.query(trackingSql, {
      order_id,
      status,
      latitude: latitude || null,
      longitude: longitude || null,
      notes: notes || '',
      created_by: req.current_id
    });

    // If delivered, update truck status back to active
    if (status === 'delivered') {
      const truckSql = `
        UPDATE trucks t
        INNER JOIN \`order\` o ON t.id = o.truck_id
        SET t.status = 'active',
            t.updated_at = NOW()
        WHERE o.id = :order_id
      `;

      await db.query(truckSql, { order_id });
    }

    await db.query("COMMIT");

    // Send notification
    await sendDeliveryNotification(order_id, status, req.current_id);

    res.json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: {
        order_id,
        status,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    await db.query("ROLLBACK");
    logError("delivery.updateOrderDeliveryStatus", error, res);
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Send delivery notification
 */
async function sendDeliveryNotification(order_id, status, user_id) {
  try {
    // Get order details
    const [order] = await db.query(`
      SELECT o.order_no, c.name as customer_name, u.phone as admin_phone
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN user u ON o.user_id = u.id
      WHERE o.id = ?
    `, [order_id]);

    if (!order.length) return;

    const orderData = order[0];

    // Create notification message
    const message = `🚚 Delivery Update: Order ${orderData.order_no} (${orderData.customer_name}) is now ${status}`;

    // Save to notifications table if exists
    const notificationSql = `
      INSERT INTO notifications 
        (user_id, title, message, type, data, is_read, created_at)
      VALUES (?, ?, ?, 'delivery', ?, 0, NOW())
    `;

    await db.query(notificationSql, [
      user_id,
      `Delivery Status Update - ${orderData.order_no}`,
      message,
      JSON.stringify({ order_id, status })
    ]);

    // Send Telegram notification if configured
    if (process.env.TELEGRAM_BOT_TOKEN) {
      const telegramMessage = `
📦 *DELIVERY UPDATE*
Order: ${orderData.order_no}
Customer: ${orderData.customer_name}
Status: ${status.toUpperCase()}
Time: ${new Date().toLocaleString()}
      `;

      // Assuming you have a sendTelegram function
      // await sendTelegram(telegramMessage);
    }

  } catch (error) {
    console.error('Notification error:', error);
  }
}

// delivery.controller.js - FIXED MySQL2 SYNTAX

/**
 * Update delivery tracking status (FIXED MySQL2 syntax)
 */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { order_id, status, latitude, longitude, notes } = req.body;
    const user_id = req.current_id;

    // 1. Check if order exists and user has permission
    const [order] = await db.query(
      `SELECT o.* 
       FROM \`order\` o
       INNER JOIN user u ON o.user_id = u.id
       WHERE o.id = ?
         AND u.group_id = (SELECT group_id FROM user WHERE id = ?)`,
      [order_id, req.current_id]
    );

    if (!order || order.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or no permission'
      });
    }

    // 2. Get user name for tracking
    const [user] = await db.query(
      `SELECT name FROM user WHERE id = ?`,
      [req.current_id]
    );
    const driver_name = user[0]?.name || 'Unknown';

    // 3. Create tracking record (FIXED: Use ? placeholders)
    const trackingSql = `
      INSERT INTO delivery_tracking 
        (order_id, driver_id, latitude, longitude, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(trackingSql, [
      order_id,
      user_id,
      latitude || null,
      longitude || null,
      status,
      notes || '',
      user_id
    ]);

    // 4. Update order delivery status (FIXED: Use ? placeholders)
    const updateSql = `
      UPDATE \`order\` 
      SET delivery_status = ?,
          ${status === 'delivered' ? 'actual_delivery_date = NOW(), ' : ''}
          updated_at = NOW()
      WHERE id = ?
    `;

    await db.query(updateSql, [status, order_id]);

    // 5. Update truck driver name if not set
    if (order[0].truck_id) {
      await db.query(
        `UPDATE trucks SET 
          driver_name = COALESCE(driver_name, ?),
          updated_at = NOW()
         WHERE id = ?`,
        [driver_name, order[0].truck_id]
      );
    }

    res.json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: {
        order_id,
        status,
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Delivery status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update delivery status'
    });
  }
};

/**
 * Get delivery tracking history (FIXED MySQL2 syntax)
 */
exports.getDeliveryTracking = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check permission (FIXED: Use ? placeholders)
    const permissionSql = `
      SELECT 1 
      FROM \`order\` o
      INNER JOIN user u ON o.user_id = u.id
      WHERE o.id = ?
        AND u.group_id = (SELECT group_id FROM user WHERE id = ?)
    `;

    const [hasPermission] = await db.query(permissionSql, [orderId, req.current_id]);

    if (!hasPermission || hasPermission.length === 0) {
      return res.status(403).json({
        success: false,
        error: "No permission to view this order's tracking"
      });
    }

    // FIXED: Use ? placeholders
    const sql = `
      SELECT 
        dt.*,
        u.name as driver_name,
        u.username as driver_username,
        t.driver_name as truck_driver,
        DATE_FORMAT(dt.timestamp, '%Y-%m-%d %H:%i:%s') as formatted_time
      FROM delivery_tracking dt
      LEFT JOIN user u ON dt.created_by = u.id
      LEFT JOIN \`order\` o ON dt.order_id = o.id
      LEFT JOIN trucks t ON o.truck_id = t.id
      WHERE dt.order_id = ?
      ORDER BY dt.timestamp ASC
    `;

    const [tracking] = await db.query(sql, [orderId]);

    // Get order summary (FIXED: Use ? placeholders)
    const orderSql = `
      SELECT 
        o.*,
        c.name as customer_name,
        cl.location_name,
        cl.address as delivery_address,
        t.plate_number,
        t.driver_name as truck_driver
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN customer_locations cl ON o.location_id = cl.id
      LEFT JOIN trucks t ON o.truck_id = t.id
      WHERE o.id = ?
    `;

    const [order] = await db.query(orderSql, [orderId]);

    res.json({
      success: true,
      tracking,
      order: order[0] || null,
      total_updates: tracking.length
    });

  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get delivery tracking'
    });
  }
};

/**
 * Get driver location (FIXED MySQL2 syntax)
 */
exports.getDriverLocation = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check permission (FIXED: Use ? placeholders)
    const permissionSql = `
      SELECT 1 
      FROM \`order\` o
      INNER JOIN user u ON o.user_id = u.id
      WHERE o.id = ?
        AND u.group_id = (SELECT group_id FROM user WHERE id = ?)
    `;

    const [hasPermission] = await db.query(permissionSql, [orderId, req.current_id]);

    if (!hasPermission || hasPermission.length === 0) {
      return res.status(403).json({
        success: false,
        error: "No permission to view driver location"
      });
    }

    // FIXED: Use ? placeholders
    const sql = `
      SELECT 
        dt.latitude,
        dt.longitude,
        dt.timestamp as last_updated,
        u.name as driver_name,
        u.username as driver_username,
        t.plate_number,
        t.driver_name as truck_driver
      FROM delivery_tracking dt
      LEFT JOIN user u ON dt.created_by = u.id
      LEFT JOIN \`order\` o ON dt.order_id = o.id
      LEFT JOIN trucks t ON o.truck_id = t.id
      WHERE dt.order_id = ?
        AND dt.latitude IS NOT NULL
        AND dt.longitude IS NOT NULL
      ORDER BY dt.timestamp DESC
      LIMIT 1
    `;

    const [location] = await db.query(sql, [orderId]);

    res.json({
      success: true,
      location: location[0] || null,
      source: 'tracking_history'
    });

  } catch (error) {
    console.error('Get driver location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get driver location'
    });
  }
};
/**
 * Get active deliveries (FIXED - simplified without drivers table)
 */
exports.getActiveDeliveries = async (req, res) => {
  try {
    const { driver_name, truck_id } = req.query;

    let sql = `
      SELECT 
        o.id as order_id,
        o.order_no,
        o.customer_id,
        c.name as customer_name,
        c.tel as customer_phone,
        o.location_id,
        cl.location_name,
        cl.address as delivery_address,
        cl.latitude,
        cl.longitude,
        o.truck_id,
        t.plate_number,
        t.driver_name as truck_driver,
        t.driver_phone as driver_phone,
        o.delivery_status,
        o.order_date,
        o.delivery_date,
        o.actual_delivery_date,
        o.total_amount,
        
        -- Latest tracking info
        (SELECT status FROM delivery_tracking WHERE order_id = o.id ORDER BY timestamp DESC LIMIT 1) as latest_status,
        (SELECT timestamp FROM delivery_tracking WHERE order_id = o.id ORDER BY timestamp DESC LIMIT 1) as latest_tracking_time
        
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN customer_locations cl ON o.location_id = cl.id
      LEFT JOIN trucks t ON o.truck_id = t.id
      WHERE o.delivery_status IN ('pending', 'in_transit')
        AND o.user_id IN (SELECT id FROM user WHERE group_id = (SELECT group_id FROM user WHERE id = :current_user_id))
    `;

    const params = { current_user_id: req.current_id };

    if (driver_name) {
      sql += ` AND t.driver_name LIKE :driver_name`;
      params.driver_name = `%${driver_name}%`;
    }

    if (truck_id) {
      sql += ` AND o.truck_id = :truck_id`;
      params.truck_id = truck_id;
    }

    sql += ` ORDER BY o.delivery_status, o.delivery_date ASC`;

    const [activeDeliveries] = await db.query(sql, params);

    res.json({
      success: true,
      active_deliveries: activeDeliveries,
      total_active: activeDeliveries.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get active deliveries error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get active deliveries"
    });
  }
};

/**
 * Update delivery location (FIXED)
 */
exports.updateDeliveryLocation = async (req, res) => {
  try {
    const { order_id, latitude, longitude, status, notes } = req.body;
    const user_id = req.current_id;

    // Verify order access
    const checkSql = `
      SELECT o.id 
      FROM \`order\` o
      INNER JOIN user u ON o.user_id = u.id
      WHERE o.id = :order_id
        AND u.group_id = (SELECT group_id FROM user WHERE id = :current_user_id)
    `;

    const [checkRows] = await db.query(checkSql, {
      order_id,
      current_user_id: req.current_id
    });

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found or no permission"
      });
    }

    // Insert tracking record
    const trackingSql = `
      INSERT INTO delivery_tracking (
        order_id,
        driver_id,
        latitude,
        longitude,
        status,
        notes,
        created_by
      ) VALUES (
        :order_id,
        :driver_id,
        :latitude,
        :longitude,
        :status,
        :notes,
        :created_by
      )
    `;

    await db.query(trackingSql, {
      order_id,
      driver_id: user_id,
      latitude: latitude || null,
      longitude: longitude || null,
      status: status || 'in_transit',
      notes: notes || null,
      created_by: user_id
    });

    // Update order delivery status if provided
    if (status) {
      await db.query(
        `UPDATE \`order\` SET 
          delivery_status = :status,
          ${status === 'delivered' ? 'actual_delivery_date = NOW(), ' : ''}
          updated_at = NOW()
         WHERE id = :order_id`,
        { status, order_id }
      );
    }

    res.json({
      success: true,
      message: "Location updated successfully",
      data: {
        order_id,
        latitude,
        longitude,
        status,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Update delivery location error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update location"
    });
  }
};

/**
 * Get active deliveries with location (SIMPLIFIED)
 */
exports.getActiveDeliveriesWithLocation = async (req, res) => {
  try {
    const sql = `
      SELECT 
        o.id as order_id,
        o.order_no,
        o.customer_id,
        c.name as customer_name,
        o.location_id,
        cl.location_name,
        cl.address as delivery_address,
        cl.latitude as destination_lat,
        cl.longitude as destination_lng,
        o.truck_id,
        t.plate_number,
        t.driver_name,
        t.driver_phone,
        o.delivery_status,
        o.delivery_date,
        
        -- Latest driver location from tracking
        dt.latitude as driver_lat,
        dt.longitude as driver_lng,
        dt.timestamp as location_updated
        
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN customer_locations cl ON o.location_id = cl.id
      LEFT JOIN trucks t ON o.truck_id = t.id
      LEFT JOIN (
        SELECT order_id, latitude, longitude, timestamp,
               ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY timestamp DESC) as rn
        FROM delivery_tracking
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ) dt ON o.id = dt.order_id AND dt.rn = 1
      WHERE o.delivery_status IN ('in_transit', 'pending')
        AND o.user_id IN (SELECT id FROM user WHERE group_id = (SELECT group_id FROM user WHERE id = :current_user_id))
      ORDER BY o.delivery_date ASC
    `;

    const [activeDeliveries] = await db.query(sql, {
      current_user_id: req.current_id
    });

    res.json({
      success: true,
      active_deliveries: activeDeliveries,
      total_active: activeDeliveries.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get active deliveries error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get active deliveries"
    });
  }
};




exports.trackDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    // Get delivery details
    const [delivery] = await db.query(`
      SELECT 
        dn.*,
        o.customer_name,
        o.delivery_address,
        t.driver_name,
        t.driver_phone
      FROM delivery_note dn
      LEFT JOIN \`order\` o ON dn.order_number = o.order_no
      LEFT JOIN trucks t ON dn.truck_id = t.id
      WHERE dn.id = ?
    `, [deliveryId]);

    // Get tracking history
    const [tracking] = await db.query(`
      SELECT * FROM delivery_tracking
      WHERE delivery_note_id = ?
      ORDER BY timestamp ASC
    `, [deliveryId]);

    // Get current location (if GPS tracking available)
    const [location] = await db.query(`
      SELECT latitude, longitude, speed, timestamp
      FROM vehicle_gps
      WHERE truck_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `, [delivery[0]?.truck_id]);

    res.json({
      success: true,
      delivery: delivery[0] || {},
      tracking_history: tracking,
      current_location: location[0] || null,
      estimated_arrival: calculateETA(location[0])
    });

  } catch (error) {
    logError("delivery.trackDelivery", error, res);
  }
};

// Update delivery status in real-time
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId, status, latitude, longitude } = req.body;

    // Update delivery note status
    await db.query(
      'UPDATE delivery_note SET delivery_status = ? WHERE id = ?',
      [status, deliveryId]
    );

    // Log tracking event
    await db.query(
      `INSERT INTO delivery_tracking 
       (delivery_note_id, status, latitude, longitude, timestamp)
       VALUES (?, ?, ?, ?, NOW())`,
      [deliveryId, status, latitude, longitude]
    );

    // Update GPS location if provided
    if (latitude && longitude) {
      const [delivery] = await db.query(
        'SELECT truck_id FROM delivery_note WHERE id = ?',
        [deliveryId]
      );

      if (delivery[0]?.truck_id) {
        await db.query(
          `INSERT INTO vehicle_gps 
           (truck_id, latitude, longitude, timestamp)
           VALUES (?, ?, ?, NOW())`,
          [delivery[0].truck_id, latitude, longitude]
        );
      }
    }

    res.json({ success: true });

  } catch (error) {
    logError("delivery.updateDeliveryStatus", error, res);
  }
};


// Driver app tracking
exports.driverUpdateLocation = async (req, res) => {
  try {
    const { driverId, latitude, longitude, deliveryId } = req.body;

    // Update driver's current location
    await db.query(
      `INSERT INTO driver_locations 
       (driver_id, latitude, longitude, timestamp)
       VALUES (?, ?, ?, NOW())`,
      [driverId, latitude, longitude]
    );

    // Update specific delivery location
    if (deliveryId) {
      await db.query(
        `UPDATE delivery_note 
         SET current_lat = ?, current_lng = ?, last_updated = NOW()
         WHERE id = ?`,
        [latitude, longitude, deliveryId]
      );
    }

    res.json({ success: true });

  } catch (error) {
    logError("driver.updateLocation", error, res);
  }
};








exports.checkDriverAuth = async (req, res) => {
  try {
    const user_id = req.current_id;


    // Get user info
    const [userResult] = await db.query(
      `SELECT tel, name, username, role_id, group_id FROM user WHERE id = :user_id`,
      { user_id }
    );

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const user = userResult[0];
    const userPhone = user.tel;


    if (!userPhone) {
      return res.json({
        success: false,
        error: "User has no phone number"
      });
    }

    // Clean phone number
    const cleanUserPhone = userPhone.replace(/\D/g, '');

    const [truckResult] = await db.query(
      `SELECT 
        t.id as truck_id, 
        t.plate_number, 
        t.driver_name, 
        t.driver_phone, 
        t.truck_type,
        t.capacity_liters,
        t.fuel_type,
        t.status
       FROM trucks t
       WHERE (t.status = 'active' OR t.status = 'on_delivery' OR t.status IS NULL)
       AND (t.driver_phone LIKE :phonePattern1 
            OR REPLACE(REPLACE(REPLACE(t.driver_phone, ' ', ''), '-', ''), '+', '') LIKE :phonePattern2
            OR t.driver_phone LIKE :phonePattern3)
       LIMIT 1`,
      {
        phonePattern1: `%${cleanUserPhone}%`,
        phonePattern2: `%${cleanUserPhone}%`,
        phonePattern3: `%${userPhone}%`
      }
    );


    let driverInfo = null;

    // If found in trucks table, user IS a driver (regardless of role_id)
    if (truckResult && truckResult.length > 0) {
      const truck = truckResult[0];

      driverInfo = {
        // User info
        user_id: user_id,
        user_name: user.name,
        username: user.username,
        role_id: user.role_id,
        group_id: user.group_id,

        // Truck info
        truck_id: truck.truck_id,
        plate_number: truck.plate_number,
        driver_name: truck.driver_name,
        driver_phone: truck.driver_phone,
        truck_type: truck.truck_type,
        capacity_liters: truck.capacity_liters,
        fuel_type: truck.fuel_type,
        status: truck.status || 'active',

        // Auth info
        authenticated_at: new Date().toISOString(),
        session_id: `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        is_driver: true,
        source: 'truck_assignment'
      };


      return res.json({
        success: true,
        driver_info: driverInfo,
        source: 'truck_database',
        message: "Driver authentication successful",
        timestamp: new Date().toISOString()
      });
    }

    // ✅ PRIORITY 2: If not in trucks, check role_id

    const driverRoles = [3, 4, 5]; // Your driver role IDs
    const isDriverByRole = driverRoles.includes(Number(user.role_id));


    if (isDriverByRole) {
      // User has driver role but no truck assigned
      driverInfo = {
        user_id: user_id,
        user_name: user.name,
        username: user.username,
        user_phone: userPhone,
        role_id: user.role_id,
        group_id: user.group_id,

        truck_id: null,
        plate_number: null,
        driver_name: user.name,
        driver_phone: userPhone,
        truck_type: null,
        capacity_liters: null,
        fuel_type: null,
        status: 'unassigned',

        authenticated_at: new Date().toISOString(),
        session_id: `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        is_driver: true,
        source: 'user_role'
      };

      return res.json({
        success: true,
        driver_info: driverInfo,
        source: 'user_role',
        message: "Driver authentication successful (no truck assigned)",
        timestamp: new Date().toISOString()
      });
    }

    // ❌ Not a driver

    return res.json({
      success: false,
      error: "User is not authorized as a driver",
      message: `You are not registered as a driver. Your role is ${user.role_id}`,
      user_info: {
        user_id: user_id,
        name: user.name,
        phone: userPhone,
        role_id: user.role_id
      },
      suggestions: [
        "Contact administrator to add you to the trucks database",
        "Make sure your phone number matches the driver_phone in trucks table",
        `Current phone: ${userPhone}`,
        `Role ID: ${user.role_id} (driver roles: 3, 4, 5)`
      ]
    });

  } catch (error) {
    console.error('❌ Driver auth error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const user_id = req.current_id;


    // ✅ FIXED: Use 'tel' field
    const [userResult] = await db.query(
      `SELECT tel FROM user WHERE id = :user_id`,
      { user_id }
    );

    if (!userResult || userResult.length === 0) {
      return res.json({ success: true, list: [] });
    }

    const userPhone = userResult[0].tel;  // ✅ FIXED

    if (!userPhone) {
      return res.json({ success: true, list: [] });
    }


    const [truckResult] = await db.query(
      `SELECT id as truck_id FROM trucks WHERE driver_phone = :phone LIMIT 1`,
      { phone: userPhone }
    );

    if (!truckResult || truckResult.length === 0) {
      return res.json({ success: true, list: [] });
    }

    const truck_id = truckResult[0].truck_id;

    // Get all orders assigned to this truck
    const sql = `
      SELECT 
        o.id as order_id,
        o.order_no,
        o.delivery_status as status,
        o.order_date,
        o.delivery_date,
        o.total_amount,
        
        -- Customer
        c.id as customer_id,
        c.name as customer_name,
        c.tel as customer_phone,
        c.address as customer_address,
        
        -- Location
        cl.id as location_id,
        cl.location_name,
        cl.address as location_address,
        cl.latitude,
        cl.longitude,
        
        -- Truck
        t.plate_number,
        t.driver_name,
        t.driver_phone,
        
        -- Latest tracking
        (SELECT dt.latitude FROM delivery_tracking dt 
         WHERE dt.order_id = o.id ORDER BY dt.timestamp DESC LIMIT 1) as last_latitude,
        (SELECT dt.longitude FROM delivery_tracking dt 
         WHERE dt.order_id = o.id ORDER BY dt.timestamp DESC LIMIT 1) as last_longitude,
        (SELECT dt.timestamp FROM delivery_tracking dt 
         WHERE dt.order_id = o.id ORDER BY dt.timestamp DESC LIMIT 1) as last_update
        
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN customer_locations cl ON o.location_id = cl.id
      LEFT JOIN trucks t ON o.truck_id = t.id
      WHERE o.truck_id = :truck_id
        AND o.delivery_status IN ('pending', 'in_transit', 'arrived')
      ORDER BY 
        FIELD(o.delivery_status, 'in_transit', 'arrived', 'pending'),
        o.delivery_date ASC
    `;

    const [assignments] = await db.query(sql, { truck_id });


    // Format response
    const formattedAssignments = assignments.map(a => ({
      order_id: a.order_id,
      order_no: a.order_no,
      status: a.status,
      order_date: a.order_date,
      delivery_date: a.delivery_date,
      total_amount: a.total_amount,
      customer_id: a.customer_id,
      customer_name: a.customer_name,
      customer_phone: a.customer_phone,
      customer_address: a.customer_address,
      location: a.location_id ? {
        id: a.location_id,
        location_name: a.location_name,
        address: a.location_address,
        latitude: a.latitude,
        longitude: a.longitude
      } : null,
      truck: {
        plate_number: a.plate_number,
        driver_name: a.driver_name,
        driver_phone: a.driver_phone
      },
      last_location: a.last_latitude && a.last_longitude ? {
        latitude: a.last_latitude,
        longitude: a.last_longitude,
        timestamp: a.last_update
      } : null
    }));

    res.json({
      success: true,
      list: formattedAssignments,
      total: formattedAssignments.length
    });

  } catch (error) {
    console.error('❌ Error getting assignments:', error);
    logError("driver.getMyAssignments", error, res);
  }
};
exports.updateLocation = async (req, res) => {
  try {
    const { order_id, latitude, longitude, status, notes } = req.body;
    const user_id = req.current_id;

    if (!order_id || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    // Insert tracking record
    const trackingSql = `
      INSERT INTO delivery_tracking 
        (order_id, driver_id, latitude, longitude, status, notes, created_by)
      VALUES (:order_id, :driver_id, :latitude, :longitude, :status, :notes, :created_by)
    `;

    await db.query(trackingSql, {
      order_id,
      driver_id: user_id,
      latitude,
      longitude,
      status: status || 'in_transit',
      notes: notes || null,
      created_by: user_id
    });

    // Update order status if provided
    if (status) {
      const updateSql = `
        UPDATE \`order\` 
        SET delivery_status = :status,
            ${status === 'delivered' ? 'actual_delivery_date = NOW(),' : ''}
            updated_at = NOW()
        WHERE id = :order_id
      `;

      await db.query(updateSql, { order_id, status });
    }

    res.json({
      success: true,
      message: "Location updated successfully"
    });

  } catch (error) {
    logError("driver.updateLocation", error, res);
  }
};

/**
 * ✅ 4. Complete delivery with photos
 */
exports.completeDelivery = async (req, res) => {
  try {
    const { order_id, latitude, longitude, notes, photos } = req.body;
    const user_id = req.current_id;

    await db.query("START TRANSACTION");

    // Update delivery tracking
    await db.query(
      `INSERT INTO delivery_tracking 
        (order_id, driver_id, latitude, longitude, status, notes, created_by)
       VALUES (:order_id, :driver_id, :latitude, :longitude, 'delivered', :notes, :created_by)`,
      {
        order_id,
        driver_id: user_id,
        latitude: latitude || null,
        longitude: longitude || null,
        notes: notes || 'Delivery completed',
        created_by: user_id
      }
    );

    // Update order status
    await db.query(
      `UPDATE \`order\` 
       SET delivery_status = 'delivered',
           actual_delivery_date = NOW(),
           updated_at = NOW()
       WHERE id = :order_id`,
      { order_id }
    );

    // Save photos if provided
    if (photos && photos.length > 0) {
      for (const photoUrl of photos) {
        await db.query(
          `INSERT INTO delivery_photos 
            (order_id, photo_url, uploaded_by, uploaded_at)
           VALUES (:order_id, :photo_url, :uploaded_by, NOW())`,
          {
            order_id,
            photo_url: photoUrl,
            uploaded_by: user_id
          }
        );
      }
    }

    // Update truck status back to active
    await db.query(
      `UPDATE trucks t
       INNER JOIN \`order\` o ON t.id = o.truck_id
       SET t.status = 'active', t.updated_at = NOW()
       WHERE o.id = :order_id`,
      { order_id }
    );

    await db.query("COMMIT");

    res.json({
      success: true,
      message: "Delivery completed successfully"
    });

  } catch (error) {
    await db.query("ROLLBACK");
    logError("driver.completeDelivery", error, res);
  }
};

/**
 * ✅ 5. Upload delivery photo
 */
exports.uploadPhoto = async (req, res) => {
  try {
    const { order_id } = req.body;
    const user_id = req.current_id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }

    // Save Cloudinary photo path to database
    const photoUrl = req.file.path;

    await db.query(
      `INSERT INTO delivery_photos 
        (order_id, photo_url, uploaded_by, uploaded_at)
       VALUES (:order_id, :photo_url, :uploaded_by, NOW())`,
      {
        order_id,
        photo_url: photoUrl,
        uploaded_by: user_id
      }
    );

    res.json({
      success: true,
      photo_url: photoUrl
    });

  } catch (error) {
    logError("driver.uploadPhoto", error, res);
  }
};

/**
 * ✅ 6. Add delivery note
 */
exports.addNote = async (req, res) => {
  try {
    const { order_id, note } = req.body;
    const user_id = req.current_id;

    await db.query(
      `INSERT INTO delivery_tracking 
        (order_id, driver_id, status, notes, created_by)
       VALUES (:order_id, :driver_id, 'note', :notes, :created_by)`,
      {
        order_id,
        driver_id: user_id,
        notes: note,
        created_by: user_id
      }
    );

    res.json({
      success: true,
      message: "Note added successfully"
    });

  } catch (error) {
    logError("driver.addNote", error, res);
  }
};

/**
 * ✅ 7. Report issue
 */
exports.reportIssue = async (req, res) => {
  try {
    const { order_id, issue_type, description, latitude, longitude } = req.body;
    const user_id = req.current_id;

    await db.query(
      `INSERT INTO delivery_issues 
        (order_id, reported_by, issue_type, description, latitude, longitude, reported_at)
       VALUES (:order_id, :reported_by, :issue_type, :description, :latitude, :longitude, NOW())`,
      {
        order_id,
        reported_by: user_id,
        issue_type,
        description,
        latitude: latitude || null,
        longitude: longitude || null
      }
    );

    // Also add tracking record
    await db.query(
      `INSERT INTO delivery_tracking 
        (order_id, driver_id, status, notes, created_by)
       VALUES (:order_id, :driver_id, 'issue', :notes, :created_by)`,
      {
        order_id,
        driver_id: user_id,
        notes: `Issue reported: ${issue_type} - ${description}`,
        created_by: user_id
      }
    );

    res.json({
      success: true,
      message: "Issue reported successfully"
    });

  } catch (error) {
    logError("driver.reportIssue", error, res);
  }
};

/**
 * ✅ 8. Get delivery history
 */
exports.getMyHistory = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const user_id = req.current_id;

    // Get driver's truck
    const [userResult] = await db.query(
      `SELECT phone FROM user WHERE id = :user_id`,
      { user_id }
    );

    if (!userResult || userResult.length === 0) {
      return res.json({ success: true, list: [] });
    }

    const [truckResult] = await db.query(
      `SELECT id as truck_id FROM trucks WHERE driver_phone = :phone LIMIT 1`,
      { phone: userResult[0].phone }
    );

    if (!truckResult || truckResult.length === 0) {
      return res.json({ success: true, list: [] });
    }

    let sql = `
      SELECT 
        o.id as order_id,
        o.order_no,
        o.delivery_status,
        o.order_date,
        o.delivery_date,
        o.actual_delivery_date,
        c.name as customer_name,
        cl.location_name
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN customer_locations cl ON o.location_id = cl.id
      WHERE o.truck_id = :truck_id
    `;

    const params = { truck_id: truckResult[0].truck_id };

    if (from_date) {
      sql += ` AND DATE(o.delivery_date) >= :from_date`;
      params.from_date = from_date;
    }

    if (to_date) {
      sql += ` AND DATE(o.delivery_date) <= :to_date`;
      params.to_date = to_date;
    }

    sql += ` ORDER BY o.delivery_date DESC LIMIT 100`;

    const [history] = await db.query(sql, params);

    res.json({
      success: true,
      list: history
    });

  } catch (error) {
    logError("driver.getMyHistory", error, res);
  }
};
// controller/delivery.controller.js
exports.authByPhone = async (req, res) => {
  try {
    const { phone } = req.body;


    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required"
      });
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/\D/g, '');


    // 步骤1: 先在 trucks 表中查找司机
    const [truckResult] = await db.query(
      `SELECT 
        t.id as truck_id, 
        t.plate_number, 
        t.driver_name, 
        t.driver_phone, 
        t.truck_type,
        t.capacity_liters,
        t.fuel_type,
        t.status
       FROM trucks t
       WHERE t.driver_phone LIKE :phonePattern
       AND (t.status = 'active' OR t.status IS NULL)
       LIMIT 1`,
      {
        phonePattern: `%${cleanPhone}%`  // 使用模糊匹配
      }
    );


    let driverInfo = null;
    let source = 'unknown';

    // 情况1: 在 trucks 表中找到司机
    if (truckResult && truckResult.length > 0) {
      const truck = truckResult[0];

      // 查找对应的用户记录
      const [userResult] = await db.query(
        `SELECT id, name, username, email, role_id 
         FROM user 
         WHERE tel LIKE :phonePattern
         LIMIT 1`,
        { phonePattern: `%${cleanPhone}%` }
      );

      driverInfo = {
        // Truck info
        truck_id: truck.truck_id,
        plate_number: truck.plate_number,
        driver_name: truck.driver_name,
        driver_phone: truck.driver_phone,
        truck_type: truck.truck_type,
        capacity_liters: truck.capacity_liters,
        fuel_type: truck.fuel_type,
        status: truck.status || 'active',

        // User info (如果找到)
        user_id: userResult?.[0]?.id || null,
        user_name: userResult?.[0]?.name || truck.driver_name,
        username: userResult?.[0]?.username || null,
        email: userResult?.[0]?.email || null,
        role_id: userResult?.[0]?.role_id || null,

        // 认证信息
        authenticated_at: new Date().toISOString(),
        session_id: `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      source = 'truck_database';

    }
    // 情况2: 在 trucks 表中没找到，但在 users 表中找到
    else {

      const [userResult] = await db.query(
        `SELECT 
          id, name, username, email, tel, role_id, group_id,
          is_active, profile_image, branch_name
         FROM user 
         WHERE tel LIKE :phonePattern
         AND is_active = 1
         LIMIT 1`,
        { phonePattern: `%${cleanPhone}%` }
      );

      if (userResult && userResult.length > 0) {
        const user = userResult[0];

        // 检查用户是否有司机角色（role_id 判断）
        const isDriver = user.role_id === 3 || user.role_id === 4; // 根据您的角色ID调整

        driverInfo = {
          // User info
          user_id: user.id,
          user_name: user.name,
          username: user.username,
          email: user.email,
          user_phone: user.tel,
          role_id: user.role_id,
          group_id: user.group_id,
          is_active: user.is_active,
          profile_image: user.profile_image,
          branch_name: user.branch_name,

          // Truck info (可能为空)
          truck_id: null,
          plate_number: null,
          driver_name: user.name, // 使用用户名作为司机名
          driver_phone: user.tel,
          truck_type: null,
          capacity_liters: null,
          fuel_type: null,
          status: isDriver ? 'active' : 'unauthorized',

          // 认证信息
          authenticated_at: new Date().toISOString(),
          session_id: `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          is_registered_as_driver: isDriver
        };

        source = 'user_database';

        if (!isDriver) {
        }
      } else {
      }
    }

    // 检查是否成功找到司机信息
    if (!driverInfo) {
      return res.status(404).json({
        success: false,
        error: "Driver not found",
        message: "No driver or user found with this phone number"
      });
    }


    res.json({
      success: true,
      driver_info: driverInfo,
      source: source,
      message: "Driver authenticated successfully"
    });

  } catch (error) {
    console.error('❌ authByPhone error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
exports.authByTruck = async (req, res) => {
  try {
    const { truck_id } = req.body;


    if (!truck_id) {
      return res.status(400).json({
        success: false,
        error: "Truck ID is required"
      });
    }

    // 查找卡车信息
    const [truckResult] = await db.query(
      `SELECT 
        t.id as truck_id, 
        t.plate_number, 
        t.driver_name, 
        t.driver_phone, 
        t.truck_type,
        t.capacity_liters,
        t.fuel_type,
        t.status
       FROM trucks t
       WHERE t.id = :truck_id 
       OR t.plate_number = :truck_id
       LIMIT 1`,
      { truck_id }
    );

    if (!truckResult || truckResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Truck not found"
      });
    }

    const truck = truckResult[0];

    let userInfo = null;

    // 如果卡车有司机电话，查找对应的用户
    if (truck.driver_phone) {
      const cleanPhone = truck.driver_phone.replace(/\D/g, '');

      const [userResult] = await db.query(
        `SELECT id, name, username, email, role_id, group_id
         FROM user 
         WHERE tel LIKE :phonePattern
         LIMIT 1`,
        { phonePattern: `%${cleanPhone}%` }
      );

      if (userResult && userResult.length > 0) {
        userInfo = userResult[0];
      }
    }

    const driverInfo = {
      // Truck info
      truck_id: truck.truck_id,
      plate_number: truck.plate_number,
      driver_name: truck.driver_name,
      driver_phone: truck.driver_phone,
      truck_type: truck.truck_type,
      capacity_liters: truck.capacity_liters,
      fuel_type: truck.fuel_type,
      status: truck.status || 'active',

      // User info (如果找到)
      user_id: userInfo?.id || null,
      user_name: userInfo?.name || truck.driver_name,
      username: userInfo?.username || null,
      email: userInfo?.email || null,
      role_id: userInfo?.role_id || null,
      group_id: userInfo?.group_id || null,

      // 认证信息
      authenticated_at: new Date().toISOString(),
      session_id: `truck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    res.json({
      success: true,
      driver_info: driverInfo,
      message: "Truck driver authenticated successfully"
    });

  } catch (error) {
    console.error('❌ authByTruck error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
};
























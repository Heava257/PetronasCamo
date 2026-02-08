const { db, logError } = require("../util/helper");

// ============================================
// CUSTOMER LOCATIONS CONTROLLER
// ============================================

/**
 * Get all locations for a specific customer
 */
exports.getCustomerLocations = async (req, res) => {
  try {
    const { customer_id } = req.params;

    const sql = `
      SELECT 
        cl.*,
        u.name as created_by_name
      FROM customer_locations cl
      LEFT JOIN user u ON cl.created_by = u.id
      INNER JOIN customer c ON cl.customer_id = c.id
      INNER JOIN user cu ON c.user_id = cu.id
      WHERE cl.customer_id = :customer_id
        AND cu.branch_id = (SELECT branch_id FROM user WHERE id = :current_user_id)
      ORDER BY cl.is_default DESC, cl.location_name ASC
    `;

    const [locations] = await db.query(sql, {
      customer_id,
      current_user_id: req.current_id
    });

    res.json({
      success: true,
      locations
    });
  } catch (error) {
    logError("location.getCustomerLocations", error, res);
  }
};

/**
 * Get all locations (with optional filters)
 */
exports.getList = async (req, res) => {
  try {
    const { customer_id, status, search } = req.query;

    let sql = `
      SELECT 
        cl.*,
        c.name as customer_name,
        c.tel as customer_tel,
        u.name as created_by_name
      FROM customer_locations cl
      INNER JOIN customer c ON cl.customer_id = c.id
      INNER JOIN user cu ON c.user_id = cu.id
      LEFT JOIN user u ON cl.created_by = u.id
      WHERE cu.branch_id = (SELECT branch_id FROM user WHERE id = :current_user_id)
    `;

    const params = { current_user_id: req.current_id };

    if (customer_id) {
      sql += ` AND cl.customer_id = :customer_id`;
      params.customer_id = customer_id;
    }

    if (status !== undefined) {
      sql += ` AND cl.status = :status`;
      params.status = status;
    }

    if (search) {
      sql += ` AND (cl.location_name LIKE :search OR cl.address LIKE :search)`;
      params.search = `%${search}%`;
    }

    sql += ` ORDER BY c.name ASC, cl.is_default DESC, cl.location_name ASC`;

    const [list] = await db.query(sql, params);

    res.json({
      success: true,
      list
    });
  } catch (error) {
    logError("location.getList", error, res);
  }
};

/**
 * Get single location by ID
 */
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        cl.*,
        c.name as customer_name,
        c.tel as customer_tel
      FROM customer_locations cl
      INNER JOIN customer c ON cl.customer_id = c.id
      INNER JOIN user cu ON c.user_id = cu.id
      WHERE cl.id = :id
        AND cu.branch_id = (SELECT branch_id FROM user WHERE id = :current_user_id)
    `;

    const [rows] = await db.query(sql, {
      id,
      current_user_id: req.current_id
    });

    if (rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Location not found"
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    logError("location.getOne", error, res);
  }
};

/**
 * Create new location
 */
exports.create = async (req, res) => {
  try {
    const {
      customer_id,
      location_name,
      address,
      latitude,
      longitude,
      default_price_adjustment,
      is_default,
      status,
      notes
    } = req.body;

    // Verify customer access
    const checkSql = `
      SELECT c.id 
      FROM customer c
      INNER JOIN user u ON c.user_id = u.id
      WHERE c.id = :customer_id
        AND u.branch_id = (SELECT branch_id FROM user WHERE id = :current_user_id)
    `;

    const [customerCheck] = await db.query(checkSql, {
      customer_id,
      current_user_id: req.current_id
    });

    if (customerCheck.length === 0) {
      return res.status(403).json({
        error: true,
        message: "No permission to add location for this customer"
      });
    }

    await db.query("START TRANSACTION");

    // If setting as default, unset other defaults for this customer
    if (is_default) {
      await db.query(
        `UPDATE customer_locations SET is_default = 0 WHERE customer_id = :customer_id`,
        { customer_id }
      );
    }

    const sql = `
      INSERT INTO customer_locations (
        customer_id,
        location_name,
        address,
        latitude,
        longitude,
        default_price_adjustment,
        is_default,
        status,
        notes,
        created_by
      ) VALUES (
        :customer_id,
        :location_name,
        :address,
        :latitude,
        :longitude,
        :default_price_adjustment,
        :is_default,
        :status,
        :notes,
        :created_by
      )
    `;

    const [result] = await db.query(sql, {
      customer_id,
      location_name,
      address,
      latitude: latitude || null,
      longitude: longitude || null,
      default_price_adjustment: default_price_adjustment || 0,
      is_default: is_default ? 1 : 0,
      status: status !== undefined ? status : 1,
      notes: notes || null,
      created_by: req.current_id
    });

    await db.query("COMMIT");

    res.json({
      success: true,
      message: "Location created successfully",
      data: { id: result.insertId }
    });
  } catch (error) {
    await db.query("ROLLBACK");
    logError("location.create", error, res);
  }
};

/**
 * Update location
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      location_name,
      address,
      latitude,
      longitude,
      default_price_adjustment,
      is_default,
      status,
      notes
    } = req.body;

    // Check permission
    const checkSql = `
      SELECT cl.id, cl.customer_id
      FROM customer_locations cl
      INNER JOIN customer c ON cl.customer_id = c.id
      INNER JOIN user u ON c.user_id = u.id
      WHERE cl.id = :id
        AND u.branch_id = (SELECT branch_id FROM user WHERE id = :current_user_id)
    `;

    const [checkResult] = await db.query(checkSql, {
      id,
      current_user_id: req.current_id
    });

    if (checkResult.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Location not found or no permission"
      });
    }

    await db.query("START TRANSACTION");

    // If setting as default, unset other defaults
    if (is_default) {
      await db.query(
        `UPDATE customer_locations 
         SET is_default = 0 
         WHERE customer_id = :customer_id AND id != :id`,
        {
          customer_id: checkResult[0].customer_id,
          id
        }
      );
    }

    const sql = `
      UPDATE customer_locations SET
        location_name = :location_name,
        address = :address,
        latitude = :latitude,
        longitude = :longitude,
        default_price_adjustment = :default_price_adjustment,
        is_default = :is_default,
        status = :status,
        notes = :notes
      WHERE id = :id
    `;

    await db.query(sql, {
      id,
      location_name,
      address,
      latitude: latitude || null,
      longitude: longitude || null,
      default_price_adjustment: default_price_adjustment || 0,
      is_default: is_default ? 1 : 0,
      status: status !== undefined ? status : 1,
      notes: notes || null
    });

    await db.query("COMMIT");

    res.json({
      success: true,
      message: "Location updated successfully"
    });
  } catch (error) {
    await db.query("ROLLBACK");
    logError("location.update", error, res);
  }
};

/**
 * Delete location
 */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permission
    const checkSql = `
      SELECT cl.id
      FROM customer_locations cl
      INNER JOIN customer c ON cl.customer_id = c.id
      INNER JOIN user u ON c.user_id = u.id
      WHERE cl.id = :id
        AND u.branch_id = (SELECT branch_id FROM user WHERE id = :current_user_id)
    `;

    const [checkResult] = await db.query(checkSql, {
      id,
      current_user_id: req.current_id
    });

    if (checkResult.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Location not found or no permission"
      });
    }

    // Check if location is being used in orders
    const [usageCheck] = await db.query(
      `SELECT COUNT(*) as count FROM \`order\` WHERE location_id = :id`,
      { id }
    );

    if (usageCheck[0].count > 0) {
      return res.status(400).json({
        error: true,
        message: "Cannot delete location that is being used in orders"
      });
    }

    await db.query(
      `DELETE FROM customer_locations WHERE id = :id`,
      { id }
    );

    res.json({
      success: true,
      message: "Location deleted successfully"
    });
  } catch (error) {
    logError("location.remove", error, res);
  }
};

/**
 * Set location as default
 */
exports.setDefault = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permission and get customer_id
    const checkSql = `
      SELECT cl.id, cl.customer_id
      FROM customer_locations cl
      INNER JOIN customer c ON cl.customer_id = c.id
      INNER JOIN user u ON c.user_id = u.id
      WHERE cl.id = :id
        AND u.branch_id = (SELECT branch_id FROM user WHERE id = :current_user_id)
    `;

    const [checkResult] = await db.query(checkSql, {
      id,
      current_user_id: req.current_id
    });

    if (checkResult.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Location not found or no permission"
      });
    }

    await db.query("START TRANSACTION");

    // Unset all defaults for this customer
    await db.query(
      `UPDATE customer_locations SET is_default = 0 WHERE customer_id = :customer_id`,
      { customer_id: checkResult[0].customer_id }
    );

    // Set this location as default
    await db.query(
      `UPDATE customer_locations SET is_default = 1 WHERE id = :id`,
      { id }
    );

    await db.query("COMMIT");

    res.json({
      success: true,
      message: "Default location set successfully"
    });
  } catch (error) {
    await db.query("ROLLBACK");
    logError("location.setDefault", error, res);
  }
};





exports.getOrdersWithLocations = async (req, res) => {
  try {
    const { search, status } = req.query;

    let sql = `
      SELECT 
        o.id,
        o.order_no,
        o.customer_id,
        o.total_amount,
        o.order_date,
        o.delivery_date,
        o.delivery_status,
        o.location_id,
        o.truck_id,
        
        -- Customer info
        c.name as customer_name,
        c.tel as customer_tel,
        c.address as customer_address,
        
        -- Location info
        cl.location_name,
        cl.address as location_address,
        cl.latitude as location_latitude,
        cl.longitude as location_longitude,
        
        -- Truck info
        t.plate_number as truck_plate_number,
        t.driver_name as truck_driver_name,
        t.driver_phone as truck_driver_phone,
        
        -- Created by
        u.name as created_by_name
        
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN customer_locations cl ON o.location_id = cl.id
      LEFT JOIN trucks t ON o.truck_id = t.id
      LEFT JOIN user u ON o.user_id = u.id
      INNER JOIN user cu ON cu.branch_id = u.branch_id
      WHERE cu.id = :current_user_id
    `;

    const params = { current_user_id: req.current_id };

    // Filter by search
    if (search) {
      sql += ` AND (o.order_no LIKE :search OR c.name LIKE :search)`;
      params.search = `%${search}%`;
    }

    // Filter by status
    if (status) {
      sql += ` AND o.delivery_status = :status`;
      params.status = status;
    }

    sql += ` ORDER BY o.create_at DESC`;

    const [list] = await db.query(sql, params);

    res.json({
      success: true,
      list
    });

  } catch (error) {
    logError("order.getOrdersWithLocations", error, res);
  }
};

/**
 * Get order details with full location and tracking info
 * សម្រាប់បង្ហាញលម្អិតនៅក្នុង Map Modal
 */
exports.getOrderDetailsForMap = async (req, res) => {
  try {
    const { id } = req.params;

    // Get order basic info
    const orderSql = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.tel as customer_tel,
        c.address as customer_address,
        u.name as created_by_name
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN user u ON o.user_id = u.id
      INNER JOIN user cu ON cu.branch_id = u.branch_id
      WHERE o.id = :id AND cu.id = :current_user_id
    `;

    const [orderRows] = await db.query(orderSql, {
      id,
      current_user_id: req.current_id
    });

    if (orderRows.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Order not found"
      });
    }

    const order = orderRows[0];

    // Get location info
    let location = null;
    if (order.location_id) {
      const locationSql = `
        SELECT * FROM customer_locations WHERE id = :location_id
      `;
      const [locationRows] = await db.query(locationSql, {
        location_id: order.location_id
      });
      location = locationRows[0] || null;
    }

    // Get truck info
    let truck = null;
    if (order.truck_id) {
      const truckSql = `
        SELECT * FROM trucks WHERE id = :truck_id
      `;
      const [truckRows] = await db.query(truckSql, {
        truck_id: order.truck_id
      });
      truck = truckRows[0] || null;
    }

    // Get tracking history
    const trackingSql = `
      SELECT 
        dt.*,
        u.name as created_by_name
      FROM delivery_tracking dt
      LEFT JOIN user u ON dt.created_by = u.id
      WHERE dt.order_id = :order_id
      ORDER BY dt.timestamp DESC
    `;

    const [tracking] = await db.query(trackingSql, {
      order_id: id
    });

    // Get order items
    const itemsSql = `
      SELECT 
        od.*,
        p.name as product_name,
        c.name as category_name
      FROM order_detail od
      LEFT JOIN product p ON od.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      WHERE od.order_id = :order_id
    `;

    const [items] = await db.query(itemsSql, {
      order_id: id
    });

    res.json({
      success: true,
      data: {
        ...order,
        customer: {
          name: order.customer_name,
          tel: order.customer_tel,
          address: order.customer_address
        },
        location,
        truck,
        tracking,
        items
      }
    });

  } catch (error) {
    logError("order.getOrderDetailsForMap", error, res);
  }
};

/**
 * Update delivery tracking with GPS coordinates
 * សម្រាប់ driver app (អនាគត)
 */
exports.updateDeliveryLocation = async (req, res) => {
  try {
    const { order_id, latitude, longitude, status, notes } = req.body;

    // Verify order access
    const checkSql = `
      SELECT o.id 
      FROM \`order\` o
      INNER JOIN user u ON o.user_id = u.id
      INNER JOIN user cu ON u.branch_id = cu.branch_id
      WHERE o.id = :order_id AND cu.id = :current_user_id
    `;

    const [checkRows] = await db.query(checkSql, {
      order_id,
      current_user_id: req.current_id
    });

    if (checkRows.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Order not found or no permission"
      });
    }

    // Insert tracking record
    const sql = `
      INSERT INTO delivery_tracking (
        order_id,
        latitude,
        longitude,
        status,
        notes,
        created_by
      ) VALUES (
        :order_id,
        :latitude,
        :longitude,
        :status,
        :notes,
        :created_by
      )
    `;

    await db.query(sql, {
      order_id,
      latitude: latitude || null,
      longitude: longitude || null,
      status: status || 'in_transit',
      notes: notes || null,
      created_by: req.current_id
    });

    // Update order delivery status if provided
    if (status) {
      await db.query(
        `UPDATE \`order\` SET delivery_status = :status WHERE id = :order_id`,
        { status, order_id }
      );
    }

    res.json({
      success: true,
      message: "Location updated successfully"
    });

  } catch (error) {
    logError("order.updateDeliveryLocation", error, res);
  }
};
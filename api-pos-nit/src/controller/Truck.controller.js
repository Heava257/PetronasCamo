const { db, logError } = require("../util/helper");

// ============================================
// TRUCKS CONTROLLER
// ============================================

/**
 * Get all trucks
 */
exports.getList = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let sql = `
      SELECT 
        t.*,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM \`order\` o WHERE o.truck_id = t.id AND o.delivery_status = 'in_transit') as active_deliveries
      FROM trucks t
      LEFT JOIN user u ON t.created_by = u.id
      WHERE 1=1
    `;
    
    const params = {};
    
    if (status) {
      sql += ` AND t.status = :status`;
      params.status = status;
    }
    
    if (search) {
      sql += ` AND (t.plate_number LIKE :search OR t.driver_name LIKE :search OR t.driver_phone LIKE :search)`;
      params.search = `%${search}%`;
    }
    
    sql += ` ORDER BY t.status ASC, t.plate_number ASC`;
    
    const [list] = await db.query(sql, params);
    
    res.json({ 
      success: true,
      list 
    });
  } catch (error) {
    logError("truck.getList", error, res);
  }
};

/**
 * Get single truck
 */
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        t.*,
        u.name as created_by_name
      FROM trucks t
      LEFT JOIN user u ON t.created_by = u.id
      WHERE t.id = :id
    `;
    
    const [rows] = await db.query(sql, { id });
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: true,
        message: "Truck not found" 
      });
    }
    
    // Get recent assignments
    const assignmentsSql = `
      SELECT 
        da.*,
        o.order_no,
        c.name as customer_name,
        cl.location_name
      FROM driver_assignments da
      INNER JOIN \`order\` o ON da.order_id = o.id
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN customer_locations cl ON o.location_id = cl.id
      WHERE da.truck_id = :id
      ORDER BY da.assigned_at DESC
      LIMIT 10
    `;
    
    const [assignments] = await db.query(assignmentsSql, { id });
    
    res.json({ 
      success: true,
      data: {
        ...rows[0],
        recent_assignments: assignments
      }
    });
  } catch (error) {
    logError("truck.getOne", error, res);
  }
};
exports.create = async (req, res) => {
  try {
    const {
      plate_number,
      truck_type,
      capacity_liters,
      driver_name,
      driver_phone,
      status,
      notes
    } = req.body;
    
    // Check if plate number already exists
    const [existingTruck] = await db.query(
      `SELECT id FROM trucks WHERE plate_number = :plate_number`,
      { plate_number }
    );
    
    if (existingTruck.length > 0) {
      return res.status(400).json({
        error: true,
        message: "Plate number already exists"
      });
    }
    
    // ✅✅✅ FIX: Ensure status always has a value ✅✅✅
    const truckStatus = status || 'active';
    
    const sql = `
      INSERT INTO trucks (
        plate_number,
        truck_type,
        capacity_liters,
        driver_name,
        driver_phone,
        status,
        notes,
        created_by,
        created_at
      ) VALUES (
        :plate_number,
        :truck_type,
        :capacity_liters,
        :driver_name,
        :driver_phone,
        :status,
        :notes,
        :created_by,
        NOW()
      )
    `;
    
    const [result] = await db.query(sql, {
      plate_number,
      truck_type: truck_type || 'medium',
      capacity_liters: capacity_liters || null,
      driver_name: driver_name || null,
      driver_phone: driver_phone || null,
      status: truckStatus, // ✅ Always set status
      notes: notes || null,
      created_by: req.current_id
    });
    
    res.json({
      success: true,
      message: "Truck created successfully",
      data: { id: result.insertId }
    });
  } catch (error) {
    logError("truck.create", error, res);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    
    if (!id || !status) {
      return res.status(400).json({
        error: true,
        message: "Missing truck ID or status"
      });
    }
    
    // Validate status
    const validStatuses = ['active', 'on_delivery', 'maintenance', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: true,
        message: "Invalid status"
      });
    }
    
    await db.query(
      `UPDATE trucks SET status = :status, updated_at = NOW() WHERE id = :id`,
      { id, status }
    );
    
    res.json({
      success: true,
      message: `Truck status updated to ${status}`
    });
  } catch (error) {
    logError("truck.updateStatus", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plate_number,
      truck_type,
      capacity_liters,
      driver_name,
      driver_phone,
      status,
      notes
    } = req.body;
    
    // Check if truck exists
    const [existingTruck] = await db.query(
      `SELECT id FROM trucks WHERE id = :id`,
      { id }
    );
    
    if (existingTruck.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Truck not found"
      });
    }
    
    // Check if plate number is taken by another truck
    const [plateCheck] = await db.query(
      `SELECT id FROM trucks WHERE plate_number = :plate_number AND id != :id`,
      { plate_number, id }
    );
    
    if (plateCheck.length > 0) {
      return res.status(400).json({
        error: true,
        message: "Plate number already exists"
      });
    }
    
    // ✅✅✅ FIX: Ensure status always has a value ✅✅✅
    const truckStatus = status || 'active';
    
    const sql = `
      UPDATE trucks SET
        plate_number = :plate_number,
        truck_type = :truck_type,
        capacity_liters = :capacity_liters,
        driver_name = :driver_name,
        driver_phone = :driver_phone,
        status = :status,
        notes = :notes,
        updated_at = NOW()
      WHERE id = :id
    `;
    
    await db.query(sql, {
      id,
      plate_number,
      truck_type,
      capacity_liters,
      driver_name,
      driver_phone,
      status: truckStatus, // ✅ Always set status
      notes
    });
    
    res.json({
      success: true,
      message: "Truck updated successfully"
    });
  } catch (error) {
    logError("truck.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if truck is being used
    const [usageCheck] = await db.query(
      `SELECT COUNT(*) as count FROM \`order\` WHERE truck_id = :id`,
      { id }
    );
    
    if (usageCheck[0].count > 0) {
      return res.status(400).json({
        error: true,
        message: "Cannot delete truck that has been used in orders. Set status to inactive instead."
      });
    }
    
    await db.query(
      `DELETE FROM trucks WHERE id = :id`,
      { id }
    );
    
    res.json({
      success: true,
      message: "Truck deleted successfully"
    });
  } catch (error) {
    logError("truck.remove", error, res);
  }
};

/**
 * Get available trucks for assignment
 */
exports.getAvailable = async (req, res) => {
  try {
    const { date } = req.query;
    
    const sql = `
      SELECT 
        t.*,
        COUNT(da.id) as assigned_today
      FROM trucks t
      LEFT JOIN driver_assignments da ON t.id = da.truck_id 
        AND DATE(da.assigned_at) = :date
        AND da.status IN ('assigned', 'started')
      WHERE t.status = 'active'
      GROUP BY t.id
      ORDER BY assigned_today ASC, t.plate_number ASC
    `;
    
    const [trucks] = await db.query(sql, {
      date: date || new Date().toISOString().split('T')[0]
    });
    
    res.json({ 
      success: true,
      trucks 
    });
  } catch (error) {
    logError("truck.getAvailable", error, res);
  }
};

/**
 * Assign truck to order
 */
exports.assignToOrder = async (req, res) => {
  try {
    const { truck_id, order_id, driver_name, driver_phone, notes } = req.body;
    
    // Verify truck exists and is active
    const [truckCheck] = await db.query(
      `SELECT id, status, driver_name as default_driver_name, driver_phone as default_driver_phone 
       FROM trucks WHERE id = :truck_id`,
      { truck_id }
    );
    
    if (truckCheck.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Truck not found"
      });
    }
    
    if (truckCheck[0].status !== 'active') {
      return res.status(400).json({
        error: true,
        message: "Truck is not active"
      });
    }
    
    // Verify order exists and hasn't been assigned
    const [orderCheck] = await db.query(
      `SELECT id, truck_id FROM \`order\` WHERE id = :order_id`,
      { order_id }
    );
    
    if (orderCheck.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Order not found"
      });
    }
    
    await db.query("START TRANSACTION");
    
    // Update order with truck_id
    await db.query(
      `UPDATE \`order\` SET truck_id = :truck_id WHERE id = :order_id`,
      { truck_id, order_id }
    );
    
    // Create driver assignment
    const assignmentSql = `
      INSERT INTO driver_assignments (
        truck_id,
        order_id,
        driver_name,
        driver_phone,
        status,
        notes
      ) VALUES (
        :truck_id,
        :order_id,
        :driver_name,
        :driver_phone,
        'assigned',
        :notes
      )
    `;
    
    await db.query(assignmentSql, {
      truck_id,
      order_id,
      driver_name: driver_name || truckCheck[0].default_driver_name,
      driver_phone: driver_phone || truckCheck[0].default_driver_phone,
      notes: notes || null
    });
    
    // Create initial tracking entry
    await db.query(
      `INSERT INTO delivery_tracking (order_id, truck_id, status, created_by)
       VALUES (:order_id, :truck_id, 'preparing', :created_by)`,
      {
        order_id,
        truck_id,
        created_by: req.current_id
      }
    );
    
    await db.query("COMMIT");
    
    res.json({
      success: true,
      message: "Truck assigned successfully"
    });
  } catch (error) {
    await db.query("ROLLBACK");
    logError("truck.assignToOrder", error, res);
  }
};




exports.getOrderDetailsForMap = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ Get order basic info with location & truck
    const orderSql = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.tel as customer_tel,
        c.address as customer_address,
        u.name as created_by_name,
        
        -- Location info
        cl.id as location_id,
        cl.location_name,
        cl.address as location_address,
        cl.latitude,
        cl.longitude,
        
        -- Truck info
        t.id as truck_id,
        t.plate_number,
        t.driver_name,
        t.driver_phone as driver_phone,
        t.truck_type,
        t.capacity_liters
        
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN user u ON o.user_id = u.id
      LEFT JOIN customer_locations cl ON o.location_id = cl.id
      LEFT JOIN trucks t ON o.truck_id = t.id
      INNER JOIN user cu ON cu.group_id = u.group_id
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
    
    // ✅ Build structured response
    const customer = {
      name: order.customer_name,
      tel: order.customer_tel,
      address: order.customer_address
    };
    
    let location = null;
    if (order.location_id) {
      location = {
        id: order.location_id,
        location_name: order.location_name,
        address: order.location_address,
        latitude: order.latitude,
        longitude: order.longitude
      };
    }
    
    let truck = null;
    if (order.truck_id) {
      truck = {
        id: order.truck_id,
        plate_number: order.plate_number,
        driver_name: order.driver_name,
        driver_phone: order.driver_phone,
        truck_type: order.truck_type,
        capacity_liters: order.capacity_liters
      };
    }
    
    // ✅ Get tracking history (if table exists)
    let tracking = [];
    try {
      const trackingSql = `
        SELECT 
          dt.*,
          u.name as created_by_name
        FROM delivery_tracking dt
        LEFT JOIN user u ON dt.created_by = u.id
        WHERE dt.order_id = :order_id
        ORDER BY dt.timestamp DESC
      `;
      
      const [trackingRows] = await db.query(trackingSql, {
        order_id: id
      });
      
      tracking = trackingRows;
    } catch (trackingError) {
      // Skip tracking if table doesn't exist yet
    }
    
    // ✅ Get order items
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
        order_no: order.order_no,
        order_date: order.order_date,
        delivery_date: order.delivery_date,
        delivery_status: order.delivery_status || 'pending',
        total_amount: order.total_amount,
        remark: order.remark,
        customer,
        location,
        truck,
        tracking,
        items
      }
    });
    
  } catch (error) {
    console.error("Error in getOrderDetailsForMap:", error);
    logError("order.getOrderDetailsForMap", error, res);
  }
};

/**
 * Get orders with location information
 */
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
        o.created_at,
        
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
      INNER JOIN user cu ON cu.group_id = u.group_id
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
    
    sql += ` ORDER BY o.created_at DESC`;
    
    const [list] = await db.query(sql, params);
    
    res.json({
      success: true,
      list
    });
    
  } catch (error) {
    console.error("Error in getOrdersWithLocations:", error);
    logError("order.getOrdersWithLocations", error, res);
  }
};

/**
 * Update delivery tracking with GPS coordinates
 */
exports.updateDeliveryLocation = async (req, res) => {
  try {
    const { order_id, latitude, longitude, status, notes } = req.body;
    
    // Verify order access
    const checkSql = `
      SELECT o.id 
      FROM \`order\` o
      INNER JOIN user u ON o.user_id = u.id
      INNER JOIN user cu ON u.group_id = cu.group_id
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
    
    // Try to insert tracking record (skip if table doesn't exist)
    try {
      const sql = `
        INSERT INTO delivery_tracking (
          order_id,
          latitude,
          longitude,
          status,
          notes,
          created_by,
          timestamp
        ) VALUES (
          :order_id,
          :latitude,
          :longitude,
          :status,
          :notes,
          :created_by,
          NOW()
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
    } catch (trackingError) {
      // Continue even if tracking fails
    }
    
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
    console.error("Error in updateDeliveryLocation:", error);
    logError("order.updateDeliveryLocation", error, res);
  }
};
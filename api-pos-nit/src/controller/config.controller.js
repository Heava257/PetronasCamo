const { db, isArray, isEmpty, logError } = require("../util/helper");
exports.getList = async (req, res) => {
  try {
    const user_id = req.auth.id;

    const [currentUser] = await db.query(`
      SELECT 
        u.id,
        u.branch_name,
        u.group_id,
        u.role_id,
        r.code AS role_code,
        r.name AS role_name
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.id = :user_id
    `, { user_id });

    if (!currentUser || currentUser.length === 0) {
      return res.status(404).json({
        error: true,
        message: "User not found"
      });
    }

    const userRoleId = currentUser[0].role_id;
    const userBranch = currentUser[0].branch_name;

    // ✅✅✅ BUILD BRANCH FILTER ✅✅✅
    let branchFilter = '';
    if (userRoleId !== 29) {
      if (!userBranch) {
        return res.status(403).json({
          error: true,
          message: "Your account is not assigned to a branch"
        });
      }
      branchFilter = `AND creator.branch_name = '${userBranch}'`;
    }

    // ✅ Category with group filter
    const [category] = await db.query(`
      SELECT 
        c.id AS value, 
        c.name AS label, 
        c.description,
        c.actual_price  
      FROM category c
      INNER JOIN user u ON c.user_id = u.id
      WHERE u.group_id = (SELECT group_id FROM user WHERE id = :user_id)
      ORDER BY c.name ASC
    `, { user_id });

    // ✅ Expense Type with branch filter
    let expenseTypeQuery;
    if (userRoleId === 29) {
      // Super Admin - see all expense types
      expenseTypeQuery = `
        SELECT id AS value, name AS label 
        FROM expense_type 
        ORDER BY name ASC
      `;
    } else {
      // Regular users - see only expense types from their branch
      expenseTypeQuery = `
        SELECT DISTINCT et.id AS value, et.name AS label 
        FROM expense_type et
        INNER JOIN user creator ON et.user_id = creator.id
        WHERE creator.branch_name = '${userBranch}'
        ORDER BY et.name ASC
      `;
    }

    const [expense_type] = await db.query(expenseTypeQuery);

    const [expense] = await db.query(
      "SELECT id as value, name as label FROM expense"
    );

    const [user] = await db.query(
      `SELECT 
          id AS value, 
          CONCAT(name, ' - ', branch_name, ' - ', address, ' - ', tel) AS label 
       FROM user`
    );

    const [customers_with_due] = await db.query(`
      SELECT 
        c.id AS value,
        c.name AS label,
        SUM(o.total_amount - o.paid_amount) AS total_due,
        o.user_id
      FROM \`order\` o
      JOIN customer c ON o.customer_id = c.id
      WHERE (o.total_amount - o.paid_amount) > 0
        AND o.user_id = ?
      GROUP BY c.id, c.name, o.user_id
      ORDER BY c.name ASC
    `, [user_id]);

    const [role] = await db.query("SELECT id, name, code FROM role");
    const [supplier] = await db.query("SELECT id, name, code FROM supplier");

    const purchase_status = [
      { label: "Pending", value: "Pending" },
      { label: "Approved", value: "Approved" },
      { label: "Shiped", value: "Shiped" },
      { label: "Received", value: "Received" },
      { label: "Issues", value: "Issues" },
    ];

    const company_name = [
      { label: "Petronas Cambodia", value: "petronas-cambodia", country: "Cambodia" },
      { label: "KAMPUCHEA TELA LIMITED", value: "kampuchea-tela-ltd", country: "Cambodia" },
      { label: "SOK KONG IMP-EXP CO., LTD", value: "sok-kong-imp-exp", country: "Cambodia" },
      { label: "LHR ASEAN INVESTMENT CO., LTD", value: "lhr-asean-investment", country: "Cambodia" },
      { label: "SAVIMEX IMP-EXP CO., LTD", value: "savimex-imp-exp", country: "Cambodia" },
      { label: "LIM LONG CO., LTD", value: "lim-long", country: "Cambodia" },
      { label: "PAPA PETROLEUM CO., LTD", value: "papa-petroleum", country: "Cambodia" },
      { label: "THARY TRADE IMP-EXP CO., LTD", value: "thary-trade-imp-exp", country: "Cambodia" },
      { label: "BRIGHT VICTORY MEKONG PETROLEUM IMP-EXP CO., LTD", value: "bright-victory-mekong", country: "Cambodia" },
      { label: "MITTAPHEAP PERTA PETROLEUM LIMITED", value: "mittapheap-perta-petroleum", country: "Cambodia" },
      { label: "CHEVRON (CAMBODIA) LIMITED", value: "chevron-cambodia", country: "Cambodia" },
      { label: "PTT (CAMBODIA) LTD", value: "ptt-cambodia", country: "Cambodia" },
      { label: "TOTAL CAMBODGE", value: "total-cambodge", country: "Cambodia" },
      { label: "AMERICAN LUBES CO., LTD", value: "american-lubes", country: "Cambodia" },
      { label: "PETRONAS CAMBODIA CO., LTD", value: "petronas-cambodia-ltd", country: "Cambodia" }
    ];

    const brand = [
      { label: "Petronas Cambodia", value: "petronas-cambodia", country: "Cambodia" },
      { label: "Petronas Malaysia", value: "petronas-malaysia", country: "Malaysia" }
    ];

    const branch_name = [
      { label: "ទីស្នាក់ការកណ្តាល", value: "ទីស្នាក់ការកណ្តាល" },
      { label: "Phnom Penh - ភ្នំពេញ", value: "Phnom Penh" },
      { label: "Siem Reap - សៀមរាប", value: "Siem Reap" },
      { label: "Battambang - បាត់ដំបង", value: "Battambang" },
      { label: "Sihanoukville - សីហនុ", value: "Sihanoukville" },
      { label: "Kampot - កំពត", value: "Kampot" },
      { label: "Koh Kong - កោះកុង", value: "Koh Kong" },
      { label: "Takeo - តាកែវ", value: "Takeo" },
      { label: "Preah Vihear - ព្រះវិហារ", value: "Preah Vihear" },
      { label: "Kandal - កណ្ដាល", value: "Kandal" },
      { label: "Kampong Cham - កំពង់ចាម", value: "Kampong Cham" },
      { label: "Kampong Thom - កំពង់ធំ", value: "Kampong Thom" },
      { label: "Kratie - ក្រចេះ", value: "Kratie" },
      { label: "Mondulkiri - មណ្ឌលគីរី", value: "Mondulkiri" },
      { label: "Ratanakiri - រតនគិរី", value: "Ratanakiri" },
      { label: "Pursat - ពោធិ៍សាត់", value: "Pursat" },
      { label: "Svay Rieng - ស្វាយរៀង", value: "Svay Rieng" },
      { label: "Prey Veng - ព្រៃវែង", value: "Prey Veng" },
      { label: "Stung Treng - ស្ទឹងត្រង់", value: "Stung Treng" },
      { label: "Tboung Khmum - ត្បូងខ្មុំ", value: "Tboung Khmum" },
      { label: "Pailin - ប៉ៃលិន", value: "Pailin" },
      { label: "Banteay Meanchey - បន្ទាយមានជ័យ", value: "Banteay Meanchey" },
    ];

    const branch_select_loc = [
      { label: "ទីស្នាក់ការកណ្តាល", value: "ទីស្នាក់ការកណ្តាល" },
      { label: "ខេត្ត កែប", value: "Kep" },
      { label: "ខេត្ត ឧត្តរមានជ័យ", value: "Oddar Meanchey" },
      { label: "ក្រុង ភ្នំពេញ", value: "Phnom Penh" },
      { label: "ខេត្ត សៀមរាប", value: "Siem Reap" },
      { label: "ខេត្ត បាត់ដំបង", value: "Battambang" },
      { label: "ខេត្ត សីហនុ", value: "Sihanoukville" },
      { label: "ខេត្ត កំពត", value: "Kampot" },
      { label: "ខេត្ត កោះកុង", value: "Koh Kong" },
      { label: "ខេត្ត តាកែវ", value: "Takeo" },
      { label: "ខេត្ត ព្រះវិហារ", value: "Preah Vihear" },
      { label: "ខេត្ត កណ្ដាល", value: "Kandal" },
      { label: "ខេត្ត កំពង់ចាម", value: "Kampong Cham" },
      { label: "ខេត្ត កំពង់ធំ", value: "Kampong Thom" },
      { label: "ខេត្ត ក្រចេះ", value: "Kratie" },
      { label: "ខេត្ត កំពង់ស្ពឺ", value: "Kampong Spue" },
      { label: "ខេត្ត មណ្ឌលគីរី", value: "Mondulkiri" },
      { label: "ខេត្ត រតនគិរី", value: "Ratanakiri" },
      { label: "ខេត្ត ពោធិ៍សាត់", value: "Pursat" },
      { label: "ខេត្ត ស្វាយរៀង", value: "Svay Rieng" },
      { label: "ខេត្ត ព្រៃវែង", value: "Prey Veng" },
      { label: "ខេត្ត កំពង់ឆ្នាំង", value: "Kampong Chnang" },
      { label: "ខេត្ត ស្ទឹងត្រែង", value: "Stung Treng" },
      { label: "ខេត្ត ត្បូងឃ្មុំ", value: "Tboung Khmum" },
      { label: "ខេត្ត ប៉ៃលិន", value: "Pailin" },
      { label: "ខេត្ត បន្ទាយមានជ័យ", value: "Banteay Meanchey" }
    ];

    const unit = [
      { label: "L", value: "L" },
      { label: "T", value: "T" },
    ];

    // ✅ Products with group filter
    const [product] = await db.query(`
      SELECT 
        p.id AS value, 
        p.name AS label, 
        p.category_id,
        p.unit_price,
        p.actual_price,
        c.name AS category_name
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      INNER JOIN user u ON p.user_id = u.id
      WHERE u.group_id = (SELECT group_id FROM user WHERE id = :user_id)
      ORDER BY p.name ASC
    `, { user_id });

    const groupOptions = [
      { label: "Admin Group", value: 1 },
      { label: "User Group", value: 2 },
      { label: "Manager Group", value: 3 }
    ];

    res.json({
      category,
      role,
      supplier,
      purchase_status,
      brand,
      expense,
      expense_type,  // ✅ Include expense_type
      unit,
      company_name,
      user,
      branch_name,
      product,
      customers_with_due,
      branch_select_loc,
      groupOptions
    });
  } catch (error) {
    console.error('❌ Config error:', error);
    logError("config.getList", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to load configuration"
    });
  }
};
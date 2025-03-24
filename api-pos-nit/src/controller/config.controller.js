const { db, isArray, isEmpty, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const [category] = await db.query(
      "SELECT id AS value, name AS label, description FROM category"
    );
    
  
    
    // const [createby] = await db.query(
    //   "select id as value, name as label from `order`"
    // );
    
    const [expense] = await db.query(
      "select id as value, name as label from expense"
    );
    const [user] = await db.query(
      `SELECT 
          id AS value, 
          CONCAT(name, ' - ', branch_name, ' - ', address, ' - ', tel) AS label 
       FROM user`
    );
    
    // console.log(user); // 🔥 Debugging: ចេញ Console log ទិន្នន័យ
    
    
    
    
    const [role] = await db.query("select id,name,code from role");
    const [supplier] = await db.query("select id,name,code from supplier");
    // const [expense] = await db.query("select id, name from expense");
    const purchase_status = [
      {
        lebel: "Pending",
        value: "Pending",
      },
      {
        lebel: "Approved",
        value: "Approved",
      },
      {
        lebel: "Shiped",
        value: "Shiped",
      },
      {
        lebel: "Received",
        value: "Received",
      },
      {
        lebel: "Issues",
        value: "Issues",
      },
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
    
    // const [expense_type] = await db.query("SELECT * FROM expense_type");

    const [expense_type] = await db.query(
      "select id as value, name as label from expense_type"
    );

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
        // Removed duplicate Koh Kong entry
      ];
      
      
    //   { label: "Dell", value: "Dell", country: "USA" },
    //   { label: "HP", value: "HP", country: "USA" },
    //   { label: "Lenovo", value: "Lenovo", country: "China" },
    //   { label: "Asus", value: "Asus", country: "Taiwan" },
    //   { label: "Acer", value: "Acer", country: "Taiwan" },
    //   { label: "Microsoft", value: "Microsoft", country: "USA" },
    //   { label: "Panasonic", value: "Panasonic", country: "USA" },
    // ];
    const unit = [
      { label: "L", value: "L" },
      { label: "T", value: "T" },
    ];

    const product = [
      { label: "ប្រេងឥន្ធនៈ", value: "oil" },
    ];

    // const expanse_id = ("SELECT expense_type_id AS FROM expense");
    // const [customer_name] = await db.query(
    //   "SELECT name FROM customer WHERE id = ?",
      
    // );

    // const [customer] = await db.query(
    //   `select * from customer where user_id = ?` 
    // );

    res.json({
      category,
      role,
      supplier,
      purchase_status,
      brand,
      expense_type,
      // customer,
      expense,
      unit,
      company_name,
      user,
      branch_name,
      product
      // expanse_id
      // customer_name
    });
  } catch (error) {
    logError("config.getList", error, res);
  }
}; 

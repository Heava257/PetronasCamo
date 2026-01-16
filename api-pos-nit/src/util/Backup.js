

const { db, isArray, isEmpty, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    // Get date filter parameters
    let { from_date, to_date } = req.query;

    // Set default date range if not provided
    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

      // Default from_date to first day of current year
      from_date = `${currentDate.getFullYear()}-01-01`;
    }

    // Query parameters for filtering by date
    const dateFilter = from_date && to_date ?
      `AND DATE(r.create_at) BETWEEN '${from_date}' AND '${to_date}'` :
      '';

    const expenseDateFilter = from_date && to_date ?
      `AND DATE(r.expense_date) BETWEEN '${from_date}' AND '${to_date}'` :
      '';

    // Customer count - optionally filtered by date
   const customerQuery = `
  SELECT 
    COUNT(id) AS total,
    SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) AS male,
    SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) AS female
  FROM customer
  ${from_date && to_date ? `WHERE DATE(create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
`;
const [customer] = await db.query(customerQuery);


    // Employee count - typically not filtered by date unless needed
    const [employee] = await db.query(`
     SELECT 
    COUNT(id) AS total, 
    SUM(CASE WHEN gender = 1 THEN 1 ELSE 0 END) AS male, 
    SUM(CASE WHEN gender = 0 THEN 1 ELSE 0 END) AS female
FROM employee;
    `);

    // Expense data with date filter
    const expenseQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) AS total, 
        COUNT(id) AS total_expense 
      FROM expense 
      WHERE 1=1
      ${from_date && to_date ? `AND DATE(expense_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
    `;
    const [expanse] = await db.query(expenseQuery);

    // Sales data with date filter
    const saleQuery = `
      SELECT 
        CONCAT(COALESCE(SUM(r.total_amount), 0), '$') AS total, 
        COUNT(r.id) AS total_order 
      FROM \`order\` r 
      WHERE 1=1
      ${from_date && to_date ? `AND DATE(r.create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
    `;
    const [sale] = await db.query(saleQuery);

    // Sales summary by month with date filter
    const saleSummaryQuery = `
      SELECT 
        DATE_FORMAT(r.create_at, '%M') AS title, 
        SUM(r.total_amount) AS total 
      FROM \`order\` r 
      WHERE 1=1
      ${dateFilter}
      GROUP BY DATE_FORMAT(r.create_at, '%M')
    `;
    const [Sale_Summary_By_Month] = await db.query(saleSummaryQuery);

    // Expense summary by month with date filter
    const expenseSummaryQuery = `
      SELECT 
        DATE_FORMAT(r.expense_date, '%M') AS title, 
        SUM(r.amount) AS total 
      FROM expense r 
      WHERE 1=1
      ${expenseDateFilter}
      GROUP BY DATE_FORMAT(r.expense_date, '%M')
    `;
    const [Expense_Summary_By_Month] = await db.query(expenseSummaryQuery);

    // User summary data - typically not filtered by date
    const [User_Summary] = await db.query(`
      SELECT 
        r.name, 
        COUNT(u.id) AS total_users
      FROM user u
      JOIN role r ON u.role_id = r.id
      GROUP BY r.name
    `);

    const malePercentage = 0.6; // 60%
    const femalePercentage = 0.4; // 40%

    let dashboard = [
      {
        title: "អ្នកប្រើប្រាស់",
        Summary: {
          "សរុប": User_Summary.reduce((sum, row) => sum + row.total_users, 0) + " នាក់", // Correct total sum
          "អ្នកគ្រប់គ្រង": (User_Summary.find(role => role.name === 'Admin')?.total_users || 0) + " នាក់", // Ensuring valid number
          "អ្នកប្រើប្រាស់": (User_Summary.find(role => role.name === 'User')?.total_users || 0) + " នាក់" // Ensuring valid number
        }
      },

     {
  title: "អតិថិជន",
  Summary: {
    "សរុប": customer[0].total + " នាក់",
    "បុរស": customer[0].male + " នាក់",
    "ស្ត្រី": customer[0].female + " នាក់"
  }
}
,
      {
        title: "និយោជិត", // Employee
        Summary: {
          "សរុប": employee[0].total + "នាក់", // Total Employees
          "បុរស": employee[0].male + " នាក់", // Male Employees
          "ស្ត្រី": employee[0].female + " នាក់" // Female Employees
        }
      },
      {
        title: "ប្រព័ន្ធចំណាយ",
        Summary: {
          "ចំណាយ": from_date && to_date ? `${from_date} - ${to_date}` : "ខែនេះ",
          "សរុប": expanse[0].total + "$", // Total translated as "សរុប"
          "ចំនួនសរុប": expanse[0].total_expense // Total_Expense translated as "ចំណាយសរុប"
        }
      },
      {
        title: "ការលក់",
        Summary: {
          "លក់": from_date && to_date ? `${from_date} - ${to_date}` : "ខែនេះ",
          "សរុប": sale[0].total,
          "ការបញ្ជាទិញសរុប": sale[0].total_order
        }
      }
    ];

    res.json({
      dashboard,
      Sale_Summary_By_Month,
      Expense_Summary_By_Month
    });

  } catch (error) {
    logError("Dashboard.getList", error, res);
  }
};






// const { validate_token } = require("../controller/auth.controller");
// const {
//   getList,
// } = require("../controller/dashbaord.controller");
// module.exports = (app) => {
//   app.get("/api/dashbaord", validate_token("dashboard.getlist"), getList);
  
// };















worker_processes auto;
error_log /www/wwwlogs/nginx_error.log crit;
pid /www/server/nginx/logs/nginx.pid;
worker_rlimit_nofile 51200;

stream {
    log_format tcp_format '$time_local|$remote_addr|$protocol|$status|$bytes_sent|$bytes_received|$session_time|$upstream_addr|$upstream_bytes_sent|$upstream_bytes_received|$upstream_connect_time';
    access_log /www/wwwlogs/tcp-access.log tcp_format;
    error_log /www/wwwlogs/tcp-error.log;
    include /www/server/panel/vhost/nginx/tcp/*.conf;
}

events {
    use epoll;
    worker_connections 51200;
    multi_accept on;
}

http {
    include mime.types;
    include proxy.conf;
    lua_package_path "/www/server/nginx/lib/lua/?.lua;;";

    default_type application/octet-stream;

    server_names_hash_bucket_size 512;
    client_header_buffer_size 32k;
    large_client_header_buffers 4 32k;
    client_max_body_size 50m;

    sendfile on;
    tcp_nopush on;

    keepalive_timeout 60;

    tcp_nodelay on;

    fastcgi_connect_timeout 300;
    fastcgi_send_timeout 300;
    fastcgi_read_timeout 300;
    fastcgi_buffer_size 64k;
    fastcgi_buffers 4 64k;
    fastcgi_busy_buffers_size 128k;
    fastcgi_temp_file_write_size 256k;
    fastcgi_intercept_errors on;

    gzip on;
    gzip_min_length 1k;
    gzip_buffers 4 16k;
    gzip_http_version 1.1;
    gzip_comp_level 2;
    gzip_types text/plain application/javascript application/x-javascript text/javascript text/css application/xml application/json image/jpeg image/gif image/png font/ttf font/otf image/svg+xml application/xml+rss text/x-js;
    gzip_vary on;
    gzip_proxied expired no-cache no-store private auth;
    gzip_disable "MSIE [1-6]\.";

    limit_conn_zone $binary_remote_addr zone=perip:10m;
    limit_conn_zone $server_name zone=perserver:10m;

    server_tokens off;
    access_log off;

    # Default server block to handle requests made directly to the IP address
    server {
        listen 80 default_server;
        server_name _;  # Catch all server_name (matches requests to the IP)

        location / {
            return 403;  # Or change this to 404 if you prefer a "Not Found" response
        }
    }

    # HTTP - redirect petronas.coredev.online to HTTPS
    server {
        listen 80;
        server_name petronas.coredev.online www.petronas.coredev.online;

        return 301 https://$host$request_uri;  # Redirect HTTP to HTTPS
    }

    # HTTPS - Reverse Proxy for petronas.coredev.online
    server {
        listen 443 ssl http2;
        server_name petronas.coredev.online www.petronas.coredev.online;

        ssl_certificate /etc/letsencrypt/live/petronas.coredev.online/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/petronas.coredev.online/privkey.pem;
        include /etc/letsencrypt/options-ssl-nginx.conf;
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

        location / {
            proxy_pass http://localhost:3000;  # Forward traffic to the PM2 app on port 3000
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Optional: Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header X-Frame-Options SAMEORIGIN;
        add_header X-XSS-Protection "1; mode=block";
        add_header X-Content-Type-Options nosniff;
    }

    # Add more server blocks for API or other services as needed

    include /www/server/panel/vhost/nginx/*.conf;
}




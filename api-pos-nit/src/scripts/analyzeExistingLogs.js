
const { db } = require("../util/helper");
const { monitorLogEntry } = require("../controller/Security.controller");

async function analyzeAllLogs() {

  try {
    
    const [logs] = await db.query(`
      SELECT sl.* 
      FROM system_logs sl
      LEFT JOIN security_incidents si ON sl.id = si.log_id
      WHERE si.id IS NULL
      ORDER BY sl.created_at DESC
      LIMIT 1000
    `);


    if (logs.length === 0) {
      process.exit(0);
    }

    
    let processed = 0;
    let incidents = 0;
    let criticalIncidents = 0;
    let highIncidents = 0;
    let mediumIncidents = 0;

    for (const log of logs) {
      try {
        const result = await monitorLogEntry(log);
        processed++;
        
        if (!result.safe) {
          incidents++;
          if (result.risk_score >= 90) {
            criticalIncidents++;
          } else if (result.risk_score >= 75) {
            highIncidents++;
          } else if (result.risk_score >= 50) {
            mediumIncidents++;
          }
          
          if (result.threats.length > 0) {
            result.threats.forEach(threat => {
            });
          }
          
          if (result.anomalies.length > 0) {
            result.anomalies.forEach(anomaly => {
            });
          }
        }
        
        if (processed % 50 === 0) {
        }
        
        if (processed % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`❌ Error analyzing log #${log.id}:`, error.message);
      }
    }
    
    if (incidents > 0) {
    } else {
    }
    
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

analyzeAllLogs();
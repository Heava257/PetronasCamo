// src/route/Security.route.js

const { validate_token } = require("../controller/auth.controller");
const {
  getSecurityDashboard,
  analyzeLog,
  getThreatReport,
  getIncidentsList,
  blockIP,
  unblockIP,
  investigateIncident,
  resolveIncident,
  getBlacklistedIPs,
  getThreatPatterns,
  addThreatPattern,
  updateThreatPattern,
  deleteThreatPattern
} = require("../controller/Security.controller");

module.exports = (app) => {
  app.get(
    "/api/security/dashboard",
    validate_token("security.dashboard"),
    getSecurityDashboard
  );
  app.get(
    "/api/security/incidents",
    validate_token("security.incidents"),
    getIncidentsList
  );
  app.get(
    "/api/security/report",
    validate_token("security.report"),
    getThreatReport
  );
  app.get(
    "/api/security/analyze/:log_id",
    validate_token("security.analyze"),
    analyzeLog
  );
  app.get(
    "/api/security/blacklist",
    validate_token("security.blacklist"),
    getBlacklistedIPs
  );
  app.post(
    "/api/security/block-ip",
    validate_token("security.blockip"),
    blockIP
  );
  app.post(
    "/api/security/unblock-ip",
    validate_token("security.unblockip"),
    unblockIP
  );
  app.put(
    "/api/security/investigate/:incident_id",
    validate_token("security.investigate"),
    investigateIncident
  );

  app.put(
    "/api/security/resolve/:incident_id",
    validate_token("security.resolve"),
    resolveIncident
  );
  app.get(
    "/api/security/patterns",
    validate_token("security.patterns"),
    getThreatPatterns
  );
  app.post(
    "/api/security/patterns",
    validate_token("security.patterns.create"),
    addThreatPattern
  );
  app.put(
    "/api/security/patterns/:pattern_id",
    validate_token("security.patterns.update"),
    updateThreatPattern
  );
  app.delete(
    "/api/security/patterns/:pattern_id",
    validate_token("security.patterns.delete"),
    deleteThreatPattern
  );
};
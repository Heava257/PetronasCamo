const { validate_token } = require("../controller/auth.controller");
const {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyFinancialSummary
} = require("../controller/Companies.controller");

module.exports = (app) => {
  app.get(
    "/api/companies",
    validate_token(),
    getCompanies
  );
  app.get(
    "/api/companies/:id",
    validate_token(),
    getCompanyById
  );
  app.post(
    "/api/companies",
    validate_token("company.create"),
    createCompany
  );
  app.put(
    "/api/companies/:id",
    validate_token("company.update"),
    updateCompany
  );
  app.delete(
    "/api/companies/:id",
    validate_token("company.remove"),
    deleteCompany
  );
  app.get(
    "/api/companies/:id/financial-summary",
    validate_token(),
    getCompanyFinancialSummary
  );
};
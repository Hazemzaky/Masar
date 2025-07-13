"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectController_1 = require("../controllers/projectController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_1.authenticate);
// Project routes
router.post('/', projectController_1.createProject);
router.get('/', projectController_1.getProjects);
router.get('/:id', projectController_1.getProject);
router.put('/:id', projectController_1.updateProject);
router.delete('/:id', projectController_1.deleteProject);
router.get('/:id/profitability', projectController_1.getProjectProfitability);
router.get('/:id/complete', projectController_1.completeProject);
// Asset availability for projects
router.get('/assets/available', projectController_1.getAvailableAssets);
// Employee availability for projects
router.post('/employees/check-availability', projectController_1.checkEmployeeAvailability);
exports.default = router;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateActual = exports.scenarioModeling = exports.updateForecast = exports.getVariance = exports.updateBudget = exports.getBudgets = exports.createBudget = void 0;
const Budget_1 = __importDefault(require("../models/Budget"));
const Expense_1 = __importDefault(require("../models/Expense"));
const createBudget = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { department, project, period, year, category, subCategory, accountCode, amount, forecast, scenarios, notes } = req.body;
        if (!year || !category) {
            res.status(400).json({ message: 'Year and category are required.' });
            return;
        }
        const budget = new Budget_1.default({
            department,
            project,
            period,
            year,
            category,
            subCategory,
            accountCode,
            amount,
            forecast,
            scenarios,
            notes,
            actual: 0,
            variance: 0,
        });
        yield budget.save();
        res.status(201).json(budget);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.createBudget = createBudget;
const getBudgets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { department, project, period, year, category } = req.query;
        const filter = {};
        if (department)
            filter.department = department;
        if (project)
            filter.project = project;
        if (period)
            filter.period = period;
        if (year)
            filter.year = Number(year);
        if (category)
            filter.category = category;
        const budgets = yield Budget_1.default.find(filter);
        res.json(budgets);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getBudgets = getBudgets;
const updateBudget = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const oldBudget = yield Budget_1.default.findById(id);
        const budget = yield Budget_1.default.findByIdAndUpdate(id, req.body, { new: true });
        if (!budget) {
            res.status(404).json({ message: 'Budget not found' });
            return;
        }
        // Add to history
        if (oldBudget) {
            const changes = {};
            const oldBudgetObj = oldBudget.toObject();
            for (const key in req.body) {
                if (req.body[key] !== oldBudgetObj[key]) {
                    changes[key] = { from: oldBudgetObj[key], to: req.body[key] };
                }
            }
            budget.history.push({ changedBy: req.body.changedBy || 'system', date: new Date(), changes });
            yield budget.save();
        }
        res.json(budget);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateBudget = updateBudget;
const getVariance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const budget = yield Budget_1.default.findById(id);
        if (!budget) {
            res.status(404).json({ message: 'Budget not found' });
            return;
        }
        // Variance = actual - amount
        const variance = budget.actual - budget.amount;
        res.json({ variance, actual: budget.actual, budgeted: budget.amount });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getVariance = getVariance;
const updateForecast = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { forecast } = req.body;
        const budget = yield Budget_1.default.findByIdAndUpdate(id, { forecast }, { new: true });
        if (!budget) {
            res.status(404).json({ message: 'Budget not found' });
            return;
        }
        res.json(budget);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateForecast = updateForecast;
const scenarioModeling = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Accept scenario params via query or body
        const { best, worst, expected } = req.query;
        // For demo, just return the values
        res.json({ best, worst, expected });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.scenarioModeling = scenarioModeling;
const recalculateActual = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const budget = yield Budget_1.default.findById(id);
        if (!budget) {
            res.status(404).json({ message: 'Budget not found' });
            return;
        }
        // Find all expenses for this department/project/period
        const expenseFilter = { managementDepartment: budget.department };
        if (budget.project)
            expenseFilter.project = budget.project;
        // For period, assume period is 'YYYY-MM' or 'YYYY-QX' or 'YYYY'
        // We'll match by year and month if possible
        if (budget.period.match(/^\d{4}-\d{2}$/)) {
            // Month
            const [year, month] = budget.period.split('-');
            expenseFilter.date = {
                $gte: new Date(`${year}-${month}-01T00:00:00.000Z`),
                $lt: new Date(`${year}-${('0' + (parseInt(month) + 1)).slice(-2)}-01T00:00:00.000Z`)
            };
        }
        else if (budget.period.match(/^\d{4}-Q\d$/)) {
            // Quarter
            const [year, q] = budget.period.split('-Q');
            const quarter = parseInt(q);
            const startMonth = (quarter - 1) * 3 + 1;
            expenseFilter.date = {
                $gte: new Date(`${year}-${('0' + startMonth).slice(-2)}-01T00:00:00.000Z`),
                $lt: new Date(`${year}-${('0' + (startMonth + 3)).slice(-2)}-01T00:00:00.000Z`)
            };
        }
        else if (budget.period.match(/^\d{4}$/)) {
            // Year
            const year = budget.period;
            expenseFilter.date = {
                $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                $lt: new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`)
            };
        }
        const expenses = yield Expense_1.default.find(expenseFilter);
        const actual = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        budget.actual = actual;
        budget.variance = actual - budget.amount;
        yield budget.save();
        res.json({ actual, variance: budget.variance, budget });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.recalculateActual = recalculateActual;

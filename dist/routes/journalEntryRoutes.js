"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const journalEntryController_1 = require("../controllers/journalEntryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, journalEntryController_1.createJournalEntry);
router.get('/', auth_1.authenticate, journalEntryController_1.getJournalEntries);
router.put('/:id', auth_1.authenticate, journalEntryController_1.updateJournalEntry);
router.post('/:id/post', auth_1.authenticate, journalEntryController_1.postJournalEntry);
router.post('/:id/reverse', auth_1.authenticate, journalEntryController_1.reverseJournalEntry);
exports.default = router;

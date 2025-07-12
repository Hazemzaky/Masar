import { Router } from 'express';
import { createJournalEntry, getJournalEntries, updateJournalEntry, postJournalEntry, reverseJournalEntry } from '../controllers/journalEntryController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createJournalEntry);
router.get('/', authenticate, getJournalEntries);
router.put('/:id', authenticate, updateJournalEntry);
router.post('/:id/post', authenticate, postJournalEntry);
router.post('/:id/reverse', authenticate, reverseJournalEntry);

export default router; 
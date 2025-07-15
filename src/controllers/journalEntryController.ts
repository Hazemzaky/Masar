import { Request, Response } from 'express';
import JournalEntry from '../models/JournalEntry';
import Account from '../models/Account';
import { isPeriodClosed } from '../models/Period';
import { generateSerial } from '../utils/serialUtils';

export const createJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, description, lines, createdBy, period, reference, department } = req.body;
    if (period && await isPeriodClosed(period)) {
      res.status(403).json({ message: 'This period is locked and cannot be edited.' });
      return;
    }
    // Double-entry validation
    const totalDebit = lines.reduce((sum: number, l: any) => sum + Number(l.debit), 0);
    const totalCredit = lines.reduce((sum: number, l: any) => sum + Number(l.credit), 0);
    if (totalDebit !== totalCredit) {
      res.status(400).json({ message: 'Debits and credits must be equal (double-entry)' });
      return;
    }
    // Serial number generation
    const docCode = 'JE';
    const dept = department || 'AC';
    const serial = await generateSerial(docCode, dept, JournalEntry);
    const entry = new JournalEntry({ date, description, lines, createdBy, period, reference, serial });
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getJournalEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period, account, status } = req.query;
    const filter: any = {};
    if (period) filter.period = period;
    if (status) filter.status = status;
    if (account) filter['lines.account'] = account;
    const entries = await JournalEntry.find(filter).populate('lines.account');
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const entry = await JournalEntry.findById(id);
    if (!entry) {
      res.status(404).json({ message: 'Journal entry not found' });
      return;
    }
    if (entry.status !== 'draft') {
      res.status(400).json({ message: 'Only draft entries can be updated' });
      return;
    }
    if (entry.period && await isPeriodClosed(entry.period)) {
      res.status(403).json({ message: 'This period is locked and cannot be edited.' });
      return;
    }
    Object.assign(entry, req.body);
    await entry.save();
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const postJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const entry = await JournalEntry.findById(id);
    if (!entry) {
      res.status(404).json({ message: 'Journal entry not found' });
      return;
    }
    if (entry.status !== 'draft') {
      res.status(400).json({ message: 'Only draft entries can be posted' });
      return;
    }
    entry.status = 'posted';
    await entry.save();
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const reverseJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const entry = await JournalEntry.findById(id);
    if (!entry) {
      res.status(404).json({ message: 'Journal entry not found' });
      return;
    }
    if (entry.status !== 'posted') {
      res.status(400).json({ message: 'Only posted entries can be reversed' });
      return;
    }
    // Create reversal entry
    const reversalLines = entry.lines.map((l: any) => ({
      account: l.account,
      debit: l.credit,
      credit: l.debit,
      description: `Reversal of: ${l.description || ''}`,
    }));
    const reversal = new JournalEntry({
      date: new Date(),
      description: `Reversal of entry ${entry._id}`,
      lines: reversalLines,
      createdBy: req.body.createdBy || 'system',
      period: entry.period,
      status: 'posted',
      reference: `Reversal of ${entry._id}`,
    });
    entry.status = 'reversed';
    await entry.save();
    await reversal.save();
    res.json({ original: entry, reversal });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 
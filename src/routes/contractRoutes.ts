import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import Contract from '../models/Contract';

const router = Router();

// Get all contracts
router.get('/', authenticate, async (req, res) => {
  try {
    const { approvalStatus } = req.query;
    let filter: any = {};
    
    if (approvalStatus) {
      filter.approvalStatus = approvalStatus;
    }
    
    const contracts = await Contract.find(filter).populate('client');
    res.json(contracts);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get contract by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id).populate('client');
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    res.json(contract);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new contract
router.post('/', authenticate, async (req, res) => {
  try {
    const contract = new Contract(req.body);
    await contract.save();
    res.status(201).json(contract);
  } catch (error: any) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
});

// Update contract
router.put('/:id', authenticate, async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    res.json(contract);
  } catch (error: any) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
});

// Delete contract
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const contract = await Contract.findByIdAndDelete(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    res.json({ message: 'Contract deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 
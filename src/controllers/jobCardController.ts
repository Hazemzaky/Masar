import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as jobCardService from '../services/jobCardService';

export const createJobCard = async (req: AuthRequest, res: Response) => {
  try {
    const { maintenanceId, parts, notes } = req.body;
    
    if (!maintenanceId || !parts || !Array.isArray(parts)) {
      return res.status(400).json({ 
        error: 'Maintenance ID and parts array are required' 
      });
    }

    if (parts.length === 0) {
      return res.status(400).json({ 
        error: 'At least one part is required' 
      });
    }

    // Validate parts structure
    for (const part of parts) {
      if (!part.itemId || !part.quantity || part.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Each part must have itemId and quantity > 0' 
        });
      }
    }

    const jobCardData = {
      maintenanceId,
      parts,
      createdBy: req.user?.userId,
      notes
    };

    const jobCard = await jobCardService.createJobCard(jobCardData);
    res.status(201).json(jobCard);
  } catch (error: any) {
    console.error('Error creating job card:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getJobCards = async (req: Request, res: Response) => {
  try {
    const { maintenanceId, status, createdBy } = req.query;
    
    const filters: any = {};
    if (maintenanceId) filters.maintenanceId = maintenanceId as string;
    if (status) filters.status = status as string;
    if (createdBy) filters.createdBy = createdBy as string;

    const jobCards = await jobCardService.getJobCards(filters);
    res.json(jobCards);
  } catch (error: any) {
    console.error('Error fetching job cards:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getJobCard = async (req: Request, res: Response) => {
  try {
    const jobCard = await jobCardService.getJobCard(req.params.id);
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }

    res.json(jobCard);
  } catch (error: any) {
    console.error('Error fetching job card:', error);
    res.status(500).json({ error: error.message });
  }
};

export const editJobCard = async (req: AuthRequest, res: Response) => {
  try {
    const { parts, notes } = req.body;
    
    if (!parts || !Array.isArray(parts)) {
      return res.status(400).json({ 
        error: 'Parts array is required' 
      });
    }

    // Validate parts structure
    for (const part of parts) {
      if (!part.itemId || !part.quantity || part.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Each part must have itemId and quantity > 0' 
        });
      }
    }

    const editData = { parts, notes };
    const jobCard = await jobCardService.editJobCard(req.params.id, editData);
    res.json(jobCard);
  } catch (error: any) {
    console.error('Error editing job card:', error);
    res.status(400).json({ error: error.message });
  }
};

export const cancelJobCard = async (req: AuthRequest, res: Response) => {
  try {
    const jobCard = await jobCardService.cancelJobCard(req.params.id);
    res.json(jobCard);
  } catch (error: any) {
    console.error('Error cancelling job card:', error);
    res.status(400).json({ error: error.message });
  }
};

export const completeJobCard = async (req: AuthRequest, res: Response) => {
  try {
    const jobCard = await jobCardService.completeJobCard(req.params.id, req.user?.userId);
    res.json(jobCard);
  } catch (error: any) {
    console.error('Error completing job card:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteJobCard = async (req: Request, res: Response) => {
  try {
    await jobCardService.deleteJobCard(req.params.id);
    res.json({ message: 'Job card deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting job card:', error);
    res.status(400).json({ error: error.message });
  }
};

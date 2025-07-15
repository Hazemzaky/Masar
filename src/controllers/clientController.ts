import { Request, Response } from 'express';
import Client from '../models/Client';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  file?: Express.Multer.File;
}

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    let clientData;
    
    // Handle FormData if present
    if (req.body.data) {
      clientData = JSON.parse(req.body.data);
    } else {
      clientData = { ...req.body };
    }
    
    // Handle file upload if present
    if (req.file) {
      if (clientData.quotationData) {
        clientData.quotationData.quotationFile = req.file.path;
        clientData.quotationData.quotationFileName = req.file.originalname;
      }
      if (clientData.contractData) {
        clientData.contractData.contractFile = req.file.path;
        clientData.contractData.contractFileName = req.file.originalname;
      }
    }
    
    const client = new Client(clientData);
    await client.save();
    res.status(201).json(client);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const filter: any = {};
    if (type === 'contract' || type === 'quotation') {
      filter.type = type;
    }
    const clients = await Client.find(filter).populate('quotations').populate('contracts');
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id).populate('quotations').populate('contracts');
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }
    res.json(client);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }
    res.json(client);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }
    res.json({ message: 'Client deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 
import { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Document from '../models/Document';
import DocumentVersion from '../models/DocumentVersion';
import DocumentAudit from '../models/DocumentAudit';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const module = req.body.module || 'general';
    const uploadDir = `uploads/documents/${module}`;
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, `${sanitizedName}_${uniqueSuffix}${extension}`);
  }
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Define allowed file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed') as any, false);
    }
  }
});

// Get documents by module with permissions
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { module, category, entityType, entityId, page = 1, limit = 20 } = req.query;
    const userRoles = (req as any).user?.roles || [];
    const userId = (req as any).user?.userId;
    
    if (!module) {
      return res.status(400).json({ message: 'Module is required' });
    }
    
    const options = {
      limit: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      category: category as string,
      entityType: entityType as string,
      entityId: entityId as string
    };
    
    const documents = await (Document as any).getDocumentsByModule(
      module as string,
      userRoles,
      userId,
      options
    );
    
    const total = await Document.countDocuments({
      module,
      status: 'active',
      isLatestVersion: true,
      $or: [
        { 'permissions.isPublic': true },
        { 'permissions.roles': { $in: userRoles } },
        { 'permissions.users': userId }
      ]
    });
    
    res.json({
      documents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Failed to fetch documents', error });
  }
};

// Upload document
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const {
      title,
      description,
      module,
      category,
      subcategory,
      entityType,
      entityId,
      tags,
      permissions,
      expiryDate,
      retentionPeriod,
      complianceTags
    } = req.body;
    
    const userId = (req as any).user?.userId;
    const userRoles = (req as any).user?.roles || [];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const uploadedDocuments = [];
    
    for (const file of files) {
      // Generate file checksum
      const fileBuffer = fs.readFileSync(file.path);
      const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');
      
      // Check if document with same name exists (for versioning)
      const existingDoc = await Document.findOne({
        originalName: file.originalname,
        entityType,
        entityId,
        status: 'active'
      });
      
      let document;
      
      if (existingDoc) {
        // Create new version
        const newVersion = await (DocumentVersion as any).createVersion(existingDoc._id, {
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          originalName: file.originalname,
          uploadedBy: userId,
          checksum
        });
        
        // Update main document
        document = await Document.findByIdAndUpdate(existingDoc._id, {
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          currentVersion: newVersion.version,
          totalVersions: existingDoc.totalVersions + 1,
          uploadedBy: userId,
          uploadedAt: new Date()
        }, { new: true });
        
        // Log version creation
        await (DocumentAudit as any).logEvent(
          document?._id,
          'upload',
          userId,
          {
            fileName: file.originalname,
            fileSize: file.size,
            version: newVersion.version,
            previousVersion: existingDoc.currentVersion,
            changeDescription: 'New version uploaded'
          },
          {
            module,
            category,
            entityType,
            entityId
          }
        );
      } else {
        // Create new document
        document = new Document({
          title: title || file.originalname,
          description,
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          fileExtension: path.extname(file.originalname),
          module,
          category,
          subcategory,
          entityType,
          entityId,
          permissions: {
            roles: permissions?.roles || [module], // Default to module role
            users: permissions?.users || [],
            departments: permissions?.departments || [],
            isPublic: permissions?.isPublic || false
          },
          tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
          uploadedBy: userId,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          retentionPeriod: retentionPeriod ? Number(retentionPeriod) : undefined,
          complianceTags: complianceTags ? complianceTags.split(',').map((tag: string) => tag.trim()) : []
        });
        
        await document.save();
        
        // Create initial version
        await (DocumentVersion as any).createVersion(document._id, {
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          originalName: file.originalname,
          uploadedBy: userId,
          checksum
        });
        
        // Log document creation
        await (DocumentAudit as any).logEvent(
          document._id,
          'upload',
          userId,
          {
            fileName: file.originalname,
            fileSize: file.size,
            version: 1
          },
          {
            module,
            category,
            entityType,
            entityId
          }
        );
      }
      
      uploadedDocuments.push(document);
    }
    
    res.json({
      message: 'Documents uploaded successfully',
      documents: uploadedDocuments
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Failed to upload document', error });
  }
};

// Download document
export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user?.userId;
    const userRoles = (req as any).user?.roles || [];
    
    // Check access permissions
    const hasAccess = await (Document as any).checkAccess(documentId, userRoles, userId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Update access count and last accessed
    await Document.findByIdAndUpdate(documentId, {
      $inc: { accessCount: 1 },
      lastAccessedAt: new Date()
    });
    
    // Log download
    await (DocumentAudit as any).logEvent(
      documentId,
      'download',
      userId,
      {
        fileName: document.originalName,
        fileSize: document.fileSize,
        version: document.currentVersion,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        downloadMethod: 'direct'
      },
      {
        module: document.module,
        category: document.category,
        entityType: document.entityType,
        entityId: document.entityId
      }
    );
    
    // Set appropriate headers
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Length', document.fileSize);
    
    // Stream the file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Failed to download document', error });
  }
};

// Get document details
export const getDocumentDetails = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user?.userId;
    const userRoles = (req as any).user?.roles || [];
    
    // Check access permissions
    const hasAccess = await (Document as any).checkAccess(documentId, userRoles, userId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Get document versions
    const versions = await (DocumentVersion as any).getDocumentVersions(documentId);
    
    // Log view
    await (DocumentAudit as any).logEvent(
      documentId,
      'view',
      userId,
      {
        fileName: document.originalName,
        version: document.currentVersion
      },
      {
        module: document.module,
        category: document.category,
        entityType: document.entityType,
        entityId: document.entityId
      }
    );
    
    res.json({
      document,
      versions
    });
  } catch (error) {
    console.error('Error fetching document details:', error);
    res.status(500).json({ message: 'Failed to fetch document details', error });
  }
};

// Update document metadata
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user?.userId;
    const userRoles = (req as any).user?.roles || [];
    
    // Check access permissions
    const hasAccess = await (Document as any).checkAccess(documentId, userRoles, userId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const {
      title,
      description,
      tags,
      permissions,
      expiryDate,
      retentionPeriod,
      complianceTags
    } = req.body;
    
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags.split(',').map((tag: string) => tag.trim());
    if (permissions) updateData.permissions = permissions;
    if (expiryDate) updateData.expiryDate = new Date(expiryDate);
    if (retentionPeriod) updateData.retentionPeriod = Number(retentionPeriod);
    if (complianceTags) updateData.complianceTags = complianceTags.split(',').map((tag: string) => tag.trim());
    
    const document = await Document.findByIdAndUpdate(documentId, updateData, { new: true });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Log update
    await (DocumentAudit as any).logEvent(
      documentId,
      'update',
      userId,
      {
        fileName: document.originalName,
        changeDescription: 'Document metadata updated'
      },
      {
        module: document.module,
        category: document.category,
        entityType: document.entityType,
        entityId: document.entityId
      }
    );
    
    res.json({ message: 'Document updated successfully', document });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Failed to update document', error });
  }
};

// Delete document
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user?.userId;
    const userRoles = (req as any).user?.roles || [];
    
    // Check access permissions
    const hasAccess = await (Document as any).checkAccess(documentId, userRoles, userId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Soft delete - mark as deleted
    await Document.findByIdAndUpdate(documentId, { status: 'deleted' });
    
    // Log deletion
    await (DocumentAudit as any).logEvent(
      documentId,
      'delete',
      userId,
      {
        fileName: document.originalName,
        fileSize: document.fileSize,
        version: document.currentVersion
      },
      {
        module: document.module,
        category: document.category,
        entityType: document.entityType,
        entityId: document.entityId
      }
    );
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document', error });
  }
};

// Get document audit trail
export const getDocumentAuditTrail = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { action, startDate, endDate, page = 1, limit = 50 } = req.query;
    const userId = (req as any).user?.userId;
    const userRoles = (req as any).user?.roles || [];
    
    // Check access permissions
    const hasAccess = await (Document as any).checkAccess(documentId, userRoles, userId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const options = {
      action: action as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: Number(limit),
      skip: (Number(page) - 1) * Number(limit)
    };
    
    const auditTrail = await (DocumentAudit as any).getDocumentAuditTrail(documentId, options);
    
    res.json({ auditTrail });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ message: 'Failed to fetch audit trail', error });
  }
};

// Get document statistics
export const getDocumentStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get document statistics
    const totalDocuments = await Document.countDocuments();
    const totalSizeResult = await Document.aggregate([
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);

    const byModule = await Document.aggregate([
      { $group: { _id: '$module', count: { $sum: 1 } } }
    ]);

    const recentUploads = await Document.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const pendingReview = await Document.countDocuments({
      status: 'pending-review'
    });

    // Format total size
    const totalSizeBytes = totalSizeResult[0]?.totalSize || 0;
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    res.json({
      totalDocuments,
      totalSize: formatFileSize(totalSizeBytes),
      byModule: byModule.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as any),
      recentUploads,
      pendingReview
    });
  } catch (error) {
    console.error('Error getting document stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get file type statistics
export const getFileTypeStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const fileTypeStats = await Document.aggregate([
      {
        $group: {
          _id: '$fileExtension',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Map file extensions to icons and colors
    const getFileTypeInfo = (extension: string) => {
      const ext = extension.toLowerCase();
      if (ext === 'pdf') return { icon: '📄', color: '#f44336' };
      if (['doc', 'docx'].includes(ext)) return { icon: '📝', color: '#2196f3' };
      if (['xls', 'xlsx'].includes(ext)) return { icon: '📊', color: '#4caf50' };
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return { icon: '🖼️', color: '#ff9800' };
      if (['zip', 'rar'].includes(ext)) return { icon: '📦', color: '#9c27b0' };
      return { icon: '📄', color: '#757575' };
    };

    const fileTypes = fileTypeStats.map(stat => {
      const info = getFileTypeInfo(stat.type);
      return {
        type: stat.type,
        count: stat.count,
        icon: info.icon,
        color: info.color
      };
    });

    res.json({ fileTypes });
  } catch (error) {
    console.error('Error getting file type stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get recent activities
export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const activities = await DocumentAudit.find({
      action: { $in: ['upload', 'download', 'view'] }
    })
    .populate('documentId', 'title originalName module')
    .sort({ performedAt: -1 })
    .limit(10);

    const formattedActivities = activities.map(activity => ({
      _id: activity._id,
      action: activity.action,
      fileName: activity.details?.fileName || 'Unknown file',
      user: activity.performedBy,
      timestamp: activity.performedAt,
      module: activity.module
    }));

    res.json({ activities: formattedActivities });
  } catch (error) {
    console.error('Error getting recent activities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk download documents
export const bulkDownload = async (req: Request, res: Response) => {
  try {
    const { documentIds } = req.body;
    const userId = (req as any).user?.userId;
    const userRoles = (req as any).user?.roles || [];
    
    if (!documentIds || !Array.isArray(documentIds)) {
      return res.status(400).json({ message: 'Document IDs array is required' });
    }
    
    // Check access for all documents
    const accessibleDocuments = [];
    for (const documentId of documentIds) {
      const hasAccess = await (Document as any).checkAccess(documentId, userRoles, userId);
      if (hasAccess) {
        const document = await Document.findById(documentId);
        if (document && fs.existsSync(document.filePath)) {
          accessibleDocuments.push(document);
        }
      }
    }
    
    if (accessibleDocuments.length === 0) {
      return res.status(404).json({ message: 'No accessible documents found' });
    }
    
    // Log bulk download
    for (const document of accessibleDocuments) {
      await (DocumentAudit as any).logEvent(
        document._id,
        'download',
        userId,
        {
          fileName: document.originalName,
          fileSize: document.fileSize,
          version: document.currentVersion,
          downloadMethod: 'bulk'
        },
        {
          module: document.module,
          category: document.category,
          entityType: document.entityType,
          entityId: document.entityId
        }
      );
    }
    
    // For now, return the list of accessible documents
    // In a real implementation, you might want to create a ZIP file
    res.json({
      message: 'Bulk download initiated',
      documents: accessibleDocuments.map(doc => ({
        id: doc._id,
        title: doc.title,
        originalName: doc.originalName,
        downloadUrl: `/api/documents/${doc._id}/download`
      }))
    });
  } catch (error) {
    console.error('Error in bulk download:', error);
    res.status(500).json({ message: 'Failed to process bulk download', error });
  }
};

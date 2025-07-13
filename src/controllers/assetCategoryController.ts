import { Request, Response } from 'express';
import AssetCategory from '../models/AssetCategory';
import mongoose from 'mongoose';

// Get full category tree (nested)
export const getCategoryTree = async (req: Request, res: Response) => {
  try {
    // Get all root categories (level 1)
    const roots = await AssetCategory.find({ level: 1 }).lean();
    // Recursively populate children
    async function populateChildren(node: any) {
      const children = await AssetCategory.find({ parent: node._id as mongoose.Types.ObjectId }).lean();
      node.children = await Promise.all(children.map(populateChildren));
      return node;
    }
    const tree = await Promise.all(roots.map(populateChildren));
    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get flat list
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await AssetCategory.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Create new category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, parent, level } = req.body;
    if (!name || !level) {
      return res.status(400).json({ message: 'Name and level are required' });
    }
    const category = new AssetCategory({ name, parent: parent || null, level });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, parent } = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    const category = await AssetCategory.findById(id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    if (name) category.name = name;
    if (parent !== undefined) category.parent = parent;
    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete category (and optionally all children)
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    // Recursively delete children
    async function deleteRecursively(catId: mongoose.Types.ObjectId) {
      const children = await AssetCategory.find({ parent: catId });
      for (const child of children) {
        await deleteRecursively(child._id as mongoose.Types.ObjectId);
      }
      await AssetCategory.findByIdAndDelete(catId);
    }
    
    const objectId = new mongoose.Types.ObjectId(id as string);
    await deleteRecursively(objectId);
    res.json({ message: 'Category and all subcategories deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 
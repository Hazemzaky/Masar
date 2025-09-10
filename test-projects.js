const mongoose = require('mongoose');
const Project = require('./src/models/Project');

async function testProjects() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/rental_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Test project queries
    const totalProjects = await Project.countDocuments();
    console.log('Total projects:', totalProjects);
    
    const calloutProjects = await Project.countDocuments({ rentType: 'call_out' });
    console.log('Callout projects:', calloutProjects);
    
    const cancelledProjects = await Project.countDocuments({ status: 'cancelled' });
    console.log('Cancelled projects:', cancelledProjects);
    
    // Get a sample project to see the structure
    const sampleProject = await Project.findOne();
    console.log('Sample project:', sampleProject);
    
    // Get all projects to see what we have
    const allProjects = await Project.find().limit(5);
    console.log('All projects (first 5):', allProjects);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testProjects();


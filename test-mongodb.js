const mongoose = require('mongoose');
require('dotenv').config();

// Use the MongoDB URI from your .env file
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://Expogo1234:Expogo%40123@cluster0.eryvwbp.mongodb.net/complaint_portal?retryWrites=true&w=majority&appName=Cluster0';

console.log('Testing MongoDB connection...');
console.log('Connection string:', MONGODB_URI.replace(/\/\/(.*?):(.*?)@/, '//****:****@'));

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('Database name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    // Test by creating a simple model
    const testSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('Test', testSchema);
    
    // Create a test document
    const testDoc = new TestModel({ name: 'Connection test' });
    
    testDoc.save()
      .then(doc => {
        console.log('✅ Successfully created test document:', doc.name);
        
        // Clean up - delete the test document
        return TestModel.deleteOne({ _id: doc._id });
      })
      .then(() => {
        console.log('✅ Test document cleaned up successfully');
        console.log('\n🎉 MongoDB connection test completed successfully!');
        mongoose.connection.close();
      })
      .catch(err => {
        console.error('❌ Error during test:', err.message);
        mongoose.connection.close();
      });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check if your IP address is whitelisted in MongoDB Atlas');
    console.log('   2. Verify your username and password are correct');
    console.log('   3. Ensure the database "complaint_portal" exists');
    console.log('   4. Check your internet connection');
    console.log('\n📝 Note: If your password contains special characters, make sure they are URL encoded.');
    console.log('   For example, "@" should be encoded as "%40"');
  });
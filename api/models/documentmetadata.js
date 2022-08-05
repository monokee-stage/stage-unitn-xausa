const mongoose = require('mongoose');
const { Schema } = mongoose;


const documentmetadata = new Schema({
  did:String,
  created:String,
  updated:String,
  deactivated:Boolean
}, {
    collection: 'DocumentsMetadata'
});

const DocumentMetadata = mongoose.model('DocumentMetadata', documentmetadata);

module.exports = DocumentMetadata;
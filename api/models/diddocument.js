const mongoose = require('mongoose');
const { Schema } = mongoose;

/*
const verificationMethod=new Schema({
    type:String,
    id:String,
    controller:String,
    publicKeyBase58:String
});

const service=new Schema({
    type:String,
    id:String,
    serviceEndpoint:String
});
*/

const diddocument = new Schema({
  "@context":  String, //default https://w3id.org/did/v1
  id: String,
  verificationMethod: [],
  authentication:[String],
  assertionMethod:[String],
  keyAgreement:[String],
  service:[]
}, {
    collection: 'DidDocuments'
});

const DidDocument = mongoose.model('DidDocument', diddocument);

module.exports = DidDocument;
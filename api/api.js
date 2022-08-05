require('dotenv').config()
const express = require('express'); 
const mongoose = require('mongoose');
const DidDocument=require('./models/diddocument')
const DocumentMetadata=require('./models/documentmetadata')
const bs58=require('bs58')
const ed = require('@noble/ed25519');

const PCT_ENCODED = '(?:%[0-9a-fA-F]{2})'
const ID_CHAR = `(?:[a-zA-Z0-9._-]|${PCT_ENCODED})`
const METHOD = '([a-z0-9]+)'
const METHOD_ID = `((?:${ID_CHAR}*:)*(${ID_CHAR}+))`
const PARAM_CHAR = '[a-zA-Z0-9_.:%-]'
const PARAM = `;${PARAM_CHAR}+=${PARAM_CHAR}*`
const PARAMS = `((${PARAM})*)`
const PATH = `(/[^#?]*)?`
const QUERY = `([?][^#]*)?`
const FRAGMENT = `(#.*)?`
const DID_MATCHER = new RegExp(`^did:${METHOD}:${METHOD_ID}${PARAMS}${PATH}${QUERY}${FRAGMENT}$`)

const app=express();
var port = process.env.PORT || 8080;

//setting up express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//setting routes

/**
 * take the document from the body and stores it on mongo
 * think about the metadata
 * take a public key from the document and use it to check the signature over the document
 * if the signature is ok, proceed storing the document. Otherwise return an error 
 */
app.post("/createdid",async (req,res)=>{

  let didDocument=req.body.didDocument;
  let signature=req.body.signature;

  if(!didDocument|| !signature){ //if some data are not present abort
    res.status(400).send({
      error:"missing parameters"
    });
    return
  }
  if(await DidDocument.findOne({id:didDocument.id})){ //se esiste già un documento per quel did
    res.status(400).send({
      error:"already exist"
    });
    return
  }

  let message = Buffer.from(JSON.stringify(didDocument)); //obtain the Uint8Array version of the message 
  let decodedSignature=bs58.decode(signature);
  try{
    if(await ed.verify(decodedSignature,message,bs58.decode(didDocument.verificationMethod[0].publicKeyBase58))){
      console.log("signature verified");
      //going on with storing the did document on mongo
  
  
      let timestamp=new Date().toISOString();
      console.log(timestamp);
      if(await DocumentMetadata.findOne({did:didDocument.id})){
        res.status(400).send({
          error:"metadata already exists"
        });
        return
      }
  
      let metadata=new DocumentMetadata({
        did:didDocument.id,
        created:timestamp
      });
      console.log('saving metadata'); 
      metadata.save();
  
  
      let doc= new DidDocument({
        "@context":didDocument['@context'],
        id:didDocument.id,
        verificationMethod:didDocument.verificationMethod,
        authentication:didDocument.authentication,
        assertionMethod:didDocument.assertionMethod,
        keyAgreement:didDocument.keyAgreement,
        service:didDocument.service
      });
      doc.save();
  
      console.log("saved")
    }
  }catch(e){
    console.log("Unable to check the signature on the document")
    res.status(400).send({
      error:"Unable to check the signature on the document"
    })
    return
  }


  res.status(200).json(didDocument);

});

/**
 * query the database to retreive the corresponding DID DOcument 
 * and the needed metadata
 */
app.get('/resolvedid/:did',async (req,res)=>{

  let document= await DidDocument.findOne({id:req.params.did},{_id :0, __v:0});
  let documentMetadata= await DocumentMetadata.findOne({did:req.params.did},{_id :0, __v:0});
  
  let response={};
  let status=200;
  let resolutionMetadata= {
    contentType: "application/did+ld+json"
  };
  
  if(!document || !documentMetadata){
    response={
      '@context':'https://w3id.org/did-resolution/v1',
      didDocument:{},
      didResolutionMetadata:{
        error:"invalidDid"
      },
      didDocumentMetadata:{}
    };
    status=400;
  }
  else{
    response={
      '@context':'https://w3id.org/did-resolution/v1',
      didDocument:document,
      didResolutionMetadata:resolutionMetadata,
      didDocumentMetadata:documentMetadata
    };
  }

  res.status(status).json(response);

});


app.put('/updatekey',async (req,res)=>{
  if(!req.body.methodUrl || !req.body.newKey || !req.body.signature){
    res.status(400).send({
      result:"fail",
      error:"missing data"
    });
    return
  };
  
  let method=req.body.methodUrl;
  let newKey=req.body.newKey;
  let signature=bs58.decode(req.body.signature);

 

  //obtaining the didDocument and its metadata
  const sections = method.match(DID_MATCHER)
  let did;
  if (sections) {
    did=`did:${sections[1]}:${sections[2]}`
  }
  let didDocument = await DidDocument.findOne({id:did});
  let didDocumentMetadata=await DocumentMetadata.findOne({did:did})

  if(!didDocument){
    res.status(400).send({
      result:"fail",
      error:"invalid did inside didUrl"
    })
    return
  }

  //composing the message to check the signature
  let message = Buffer.from(JSON.stringify({
    methodUrl:method,
    newKey:newKey
  }))

  //check the signature
  if(await ed.verify(signature,message,bs58.decode(didDocument.verificationMethod[0].publicKeyBase58))){
    let found=false;
    let i=0;
    while(i<didDocument.verificationMethod.length && !found){
      if(didDocument.verificationMethod[i].id==method){
        await DidDocument.updateOne({id:didDocument.id},{"$set":{"verificationMethod.0.publicKeyBase58":newKey}}); //replace the key with the new one
        await didDocumentMetadata.updateOne({updated:new Date().toISOString()}); //update the relative metadata
        found=true;
      }
      i++;
    }

    if(!found){ //if the fragment has not been found
      res.status(400).send({
        result:"fail",
        error:"method not found (wrokg key?)"
      });
      return
    }
    //send positive response
    res.status(200).send({
      result:"success"
    })
  }
  else{ //if the signature has not been checked
    res.status(400).send({
      result:"fail",
      error:"invalid signature"
    })
  }

});

app.put('/addverificationmethod',async (req,res)=>{
  if(!req.body.did || !req.body.verificationMethod || !req.body.signature){
    res.status(400).send({
      result:"fail",
      error:"missing data"
    });
    return
  };
  
  let did=req.body.did;
  let vm=req.body.verificationMethod;
  let signature=bs58.decode(req.body.signature);

 
  let didDocument = await DidDocument.findOne({id:did});
  let didDocumentMetadata=await DocumentMetadata.findOne({did:did})

  if(!didDocument){
    res.status(400).send({
      result:"fail",
      error:"invalid did in the request"
    })
    return
  }

  //composing the message to check the signature
  let message = Buffer.from(JSON.stringify({
    did:did,
    verificationMethod:vm
  }))

  //check the signature
  if(await ed.verify(signature,message,bs58.decode(didDocument.verificationMethod[0].publicKeyBase58))){

    await DidDocument.updateOne({id:didDocument.id},{"$push":{verificationMethod:vm}}); //replace the key with the new one
    await didDocumentMetadata.updateOne({updated:new Date().toISOString()}); //update the relative metadata


    //send positive response
    res.status(200).send({
      result:"success"
    })
  }
  else{ //if the signature has not been checked
    res.status(400).send({
      result:"fail",
      error:"invalid signature"
    })
  }

});

app.delete('/deactivate/:id',async (req,res)=>{

  let did=req.params.id;
  let signature=req.body.signature;

  if(!did || ! signature ){
    res.status(400).send({
      result:"fail",
      error:"missing data"
    })
    return
  }

  let document= await DidDocument.findOne({id:did},{_id :0, __v:0});
  let documentMetadata= await DocumentMetadata.findOne({did:did},{_id :0, __v:0});

  if(!document || !documentMetadata ){
    res.status(400).send({
      result:"fail",
      error:"wrong did"
    })
    return
  }

  //check the signature
  if(! (await ed.verify(bs58.decode(signature),Buffer.from("deactivate"),bs58.decode(document.verificationMethod[0].publicKeyBase58)))){
    res.status(400).send({
      result:"fail",
      error:"invalid signature"
    })
    return
  }

  if(!document || ! documentMetadata ){
    res.status(400).send({
      result:"fail",
      error:"invalid did"
    })
    return
  }


  if(documentMetadata.deactivated){
    res.status(400).send({
      result:"fail",
      error:"did already deactivated"
    })
    return
  }

  await DocumentMetadata.updateOne({did:did},{updated:new Date().toISOString(),deactivated:true});

  res.status(200).send({
    result:"success",
  })

});



var db = mongoose.connect(process.env.MONGODB_CONNECTION_STRING).then(() => {
  console.log("Connected to Database");
  app.listen(port, () => { console.log(`Server listening`); });
}).catch((err)=> {
  console.log("Database connection Error");
  console.log(err);
});

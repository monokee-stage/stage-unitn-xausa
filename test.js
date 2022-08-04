const test=require('ava')
const method=require('./index.js')
const ed=require('@noble/ed25519')
const bs58=require('bs58')

const PCT_ENCODED = '(?:%[0-9a-fA-F]{2})'
const ID_CHAR = `(?:[a-zA-Z0-9._-]|${PCT_ENCODED})`
const METHOD = '([a-z0-9]+)'
const METHOD_ID = `((?:${ID_CHAR}*:)*(${ID_CHAR}+))`
const FRAGMENT = `(#.*)?`
const DID_MATCHER = new RegExp(`^did:${METHOD}:${METHOD_ID}`)

let did;
let privateKey=ed.utils.randomPrivateKey();
let privateKey1=ed.utils.randomPrivateKey();

test.serial('test createDID with a valid private key',async (t)=>{
	did= await method.createDID(bs58.encode(privateKey)).catch((err)=>t.fail(err));
	t.regex(did,DID_MATCHER);	
})

test('test createDID with an invalid private key',async (t)=>{
	await method.createDID(bs58.encode(Buffer.from("invalidKey")))
	.then(()=>t.fail())
	.catch(()=>t.pass());
})

test('test resolveDID with a valid DID',async (t)=>{
	await method.resolveDID(did)
	.then(()=>t.pass())
	.catch(()=>t.fail());
})

test('test resolveDID with an unvalid DID',async (t)=>{
	let response = await method.resolveDID("invalidDid").catch(()=>t.fail());
	t.deepEqual(response,{
		'@context':'https://w3id.org/did-resolution/v1',
		didDocument:{},
		didResolutionMetadata:{
		  error:"invalidDid"
		},
		didDocumentMetadata:{}
	  })
	
})


test.skip('test resolveDID with missing DID',async (t)=>{
	await method.resolveDID("")
	.then(()=>t.pass())
	.catch(()=>t.fail());
})

test.serial('test dereferenceDID with a valid didUrl',async (t)=>{
	await method.dereferenceDID(did+"#key-1")
	.then(()=>t.pass())
	.catch((err)=>t.fail(err));
})

test.serial('test dereferenceDID with an unvalid url key',async (t)=>{
	let sup=await method.dereferenceDID(did+"#invalidKey").catch((err)=>t.fail(err));
	t.deepEqual(sup,{
		dereferencingMetadata:{
			contentType:"application/json",
			error:"notFound"
		},
		contentStream:{},
		contentMetadata:{}
	})
})

test.serial('test updateKey with valid data',async (t)=>{
	let newPublicKey1= await ed.getPublicKey(privateKey1);

	await method.updateKey(bs58.encode(privateKey),bs58.encode(newPublicKey1),did+"#key-1")
	.then(()=>t.pass())
	.catch((err)=>t.fail(err))
})

test.serial('test updateKey with unvalid new publicKey',async (t)=>{
	await method.updateKey(bs58.encode(privateKey),bs58.encode(Buffer.from("invalidNewPublicKey")),did+"#key-1")
	.then(()=>t.fail())
	.catch((err)=>t.pass(err))
})

test.serial.skip('test updateKey with unvalid privateKey',async (t)=>{
	await method.updateKey(bs58.encode(Buffer.from("invalidPrivateKey")),bs58.encode(ed.getPublicKey(ed.utils.randomPrivateKey())),did+"#key-1")
	.then(()=>t.fail())
	.catch((err)=>t.pass(err))
})

test.serial('test addEd25519VerificationMethod with valid data',async (t)=>{
	let newPublicKey2= await ed.getPublicKey(ed.utils.randomPrivateKey());
    await method.addEd25519VerificationMethod(bs58.encode(newPublicKey2),bs58.encode(privateKey1),did)
	.then((res)=>{
		if(res)
			t.pass()
	})
	.catch((err)=>t.fail(err)) 
})

test.serial.skip('test addEd25519VerificationMethod with unvalid public Key for the new method',async (t)=>{
    await method.addEd25519VerificationMethod(bs58.encode(Buffer.from("thisIsAnInvalidKey")),bs58.encode(privateKey1),did)
	.then((res)=>t.fail())
	.catch(()=>t.pass()) 
})







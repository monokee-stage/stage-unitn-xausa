/**
 * while waiting for further information about the origin of the did:sov that should 
 * be contained insite a did:monokee, this is a partial implementation of the URL dereferencing process
 */
import { resolveDID } from "./resolveDID";
import { DIDDocument, ParsedDid, ServiceEndpoint, VerificationMethod , DereferencingResponse,DereferencingOptions,DereferencingMetadata, ContentMetadata } from "./types";
import fetch from 'node-fetch';

//from did-resolver
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




/**
 * dereference the did and obtain the requested data
 * @param didUrl 
 * @returns a verification method, or a service or a document depending on the didUrl
 */
export async function dereferenceDID(didUrl:string,dereferencingOptions:any): Promise<DereferencingResponse> { //
  return new Promise<DereferencingResponse>(async (resolve,reject)=>{
      let parts = parse(didUrl);
      let response :DereferencingResponse;
      let dereferencingMetadata :DereferencingMetadata;
      let responseContent: VerificationMethod | DIDDocument | ServiceEndpoint | {}={};
      let contentMetadata: ContentMetadata={};

      if(parts==null){ //invalid DID
        dereferencingMetadata={
          contentType:"application/json",
          error:"invalidDidUrl"
        };
        response={
          dereferencingMetadata:dereferencingMetadata,
          contentStream:{},
          contentMetadata:contentMetadata
        };
        resolve(response)
      }
        
      else{
        let resolution=await resolveDID((<ParsedDid>parts).did);
        if(resolution.didDocument.id){
          let didDocument=resolution.didDocument
          let methods=didDocument.verificationMethod;
          let services=didDocument.service;
          let found=false;

          //look for the key among the verification methods/services

          //still missing the did resolution
          if(methods){ //search among methods
            let i=0;
            while(i<methods.length && !found){
              let sup=parts?.did+"#"+parts?.fragment;
              if(methods[i].id==sup){
                responseContent=methods[i];
                dereferencingMetadata = {
                  contentType:"application/json"
                };
                response={
                  dereferencingMetadata:dereferencingMetadata,
                  contentStream:responseContent,
                  contentMetadata:contentMetadata
                };
                found=true;
                resolve(response);
              } 
              i++;
            }
          }
          if(services){ //search among services
            let i=0;
            while(i<services.length && !found){
              let sup=parts?.did+"#"+parts?.fragment;
              if(services[i].id==sup){ //check if the service correspond to a did:sov

                //if the service is a did:sov
                if(services[i].type=="SovrinIssuer"){
                  let url = "http://localhost:8888/1.0/identifiers/"+services[i].serviceEndpoint;
                  var sovResolved=await fetch(url).then((res:any)=>{return res.json()});
                  if(sovResolved===undefined){
                      reject("error on get request");
                  }
                  else{
                      resolve(<DereferencingResponse>sovResolved);
                  }
                }

                
                else{ //if not, simply return the service
                  responseContent=services[i];
                  dereferencingMetadata = {
                    contentType:"application/json"
                  };
                  response={
                    dereferencingMetadata:dereferencingMetadata,
                    contentStream:responseContent,
                    contentMetadata:contentMetadata
                  };
                  resolve(response);
                }
                found=true;
              } 
              i++;
            }
          }
          if(!found){
            dereferencingMetadata={
              contentType:"application/json",
              error:"notFound"
            };
            response={
              dereferencingMetadata:dereferencingMetadata,
              contentStream:responseContent,
              contentMetadata:contentMetadata
            };
            resolve(response);
          }
        }
        else{
          reject("invalid did insinde the url");
        }
        
      }
      

  });
}


/**
 * from did-resolver. Parse the did url to obtain all its components
 * @param didUrl 
 * @returns 
 */
export function parse(didUrl: string): ParsedDid | null {
  if (didUrl === '' || !didUrl) 
      return null
  const sections = didUrl.match(DID_MATCHER)
  if (sections) {
    const parts: ParsedDid = {
      did: `did:${sections[1]}:${sections[2]}`,
      method: sections[1],
      id: sections[2],
      didUrl
    }
    if (sections[4]) {
      const params = sections[4].slice(1).split(';')
      parts.params = {}
      for (const p of params) {
        const kv = p.split('=')
        parts.params[kv[0]] = kv[1]
      }
    }
    if (sections[6]) parts.path = sections[6]
    if (sections[7]) parts.query = sections[7].slice(1)
    if (sections[8]) parts.fragment = sections[8].slice(1)
    return parts
  }
  return null
}


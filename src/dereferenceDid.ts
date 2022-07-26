/**
 * while waiting for further information about the origin of the did:sov that should 
 * be contained insite a did:monokee, this is a partial implementation of the URL dereferencing process
 */
import { VerificationMethod } from "did-resolver";
import { resolveDID } from "./resolveDID";
import { DIDDocument, ParsedDid, ServiceEndpoint } from "./types";

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


interface DereferencingMetadata {

}


interface contentMetadata{

}
/**
 * dereference the did and obtain the requested data
 * @param didUrl 
 * @returns a verification method, or a service or a document depending on the didUrl
 */

export async function dereferenceDID(didUrl:string): Promise<VerificationMethod | ServiceEndpoint | DIDDocument> { //
    try {
        return new Promise<VerificationMethod | ServiceEndpoint | DIDDocument>(async (resolve,reject)=>{
            let parts = parse(didUrl);
            if(parts==null)
              reject("invalid did url")
            else{
              //If a request for a service endpoit arrives, just resolve the did or returns the service endpoint or the complete service field
              //if it contains nedded information for the enpoint usage.

              //simply return a verification method, further customization needed
              let didDocument=await resolveDID((<ParsedDid>parts).did);
              let methods=didDocument.verificationMethod;
              if(methods){
                for (let i=0;i<methods.length;i++){
                  let sup=parts?.did+"#"+parts?.fragment;
                  if(methods[i].id==sup) 
                    resolve(methods[i]); 
                }
              }
            }

        });
        
    } catch (error:any) {
        console.log(`Error occurred in dereferenceDID function ${error}`); //logger could be better
        throw error;
    }
}


/**
 * from did-resolver
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
        didUrl,
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
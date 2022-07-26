export interface ServiceEndpoint {
    id: string
    type: string
    serviceEndpoint: string
    description?: string
};

export interface VerificationMethod {
    id: string
    type: string
    controller: string
    publicKeyBase58: string
};

export interface DIDDocument {
    '@context': 'https://www.w3.org/ns/did/v1' | string | string[]
    id: string
    controller?: string | string[]
    verificationMethod?: VerificationMethod[]
    authentication?:string[]
    assertionMethod?:string[]
    keyAgreement?:string[]
    service?: ServiceEndpoint[]
};

//request body to be sent in the fetch request
export interface RequestBody{ 
    didDocument:DIDDocument //did Document
    signature:string        //base 58 signature (signature is produce from a Uint8Array of the document, not a string)
}

export interface ResponseBody{
    resolutionMetadata: string,
    didDocument:DIDDocument,
    didDocumentMetadata:string
}
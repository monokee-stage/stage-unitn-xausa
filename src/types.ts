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

export interface ResolutionMetadata{
    contentType:string
}

export interface DidDocumentMetadata{
    did:string
    created:string
    updated:string
}

export interface ResponseBody{
    resolutionMetadata: ResolutionMetadata
    didDocument:DIDDocument
    didDocumentMetadata:DidDocumentMetadata
}

export interface Params {
    [index: string]: string
}

export interface ParsedDid {
    did: string
    didUrl: string
    method: string
    id: string
    path?: string
    fragment?: string
    query?: string
    params?: Params
}

export interface DereferencingMetadata {
    contentType:string,
    error?:string
}


export interface ContentMetadata{ //must be a didDocumentMetadata if DereferencingResponse contains a DIDDocument

}

export interface DereferencingOptions{ 
    accept:string //response type requested by the caller
}

export interface DereferencingResponse{
    dereferencingMetadata:DereferencingMetadata | string,
    contentStream:ServiceEndpoint | VerificationMethod | DIDDocument |string,
    contentMetadata:ContentMetadata | string
}
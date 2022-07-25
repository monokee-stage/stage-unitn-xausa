# stage-unitn-xausa
Documentation describing A top-down approacc to DID Method implementation according to [DID-CORE](https://www.w3.org/TR/did-core/) specifications.
This documentation includes `did:monokee` Method implementation details and all the steps needed for implementing such DID Method, starting from design choiches to technical requirements.



## DID Schema
To begin developing a DID Method, The structure 
A DID is an URI with a fixed structure. For this method, the syntax is the following


```
  monokee-did            = "did:monokee:" idstring

```

The idstring conforms to [Universally unique identifier (UUID) v4](https://www.ietf.org/rfc/rfc4122.txt).

### Method-specific identifier
the `method-specific-identifier` follows the [DID Syntax](https://www.w3.org/TR/did-core/#did-syntax) specification

## CRUD Operations
### Create
### Resolve 
### Update
### Deactivate

## Security Considerations

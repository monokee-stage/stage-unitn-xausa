"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.createDID = void 0;
var uuid = require('uuid');
var ed = require("@noble/ed25519");
var bs58 = require("bs58");
var node_fetch_1 = require("node-fetch");
require('util').inspect.defaultOptions.depth = null; // just to see the full log object
;
;
;
/**
 * Creates the DID and the DID Document.
 * @returns a string containind the did
 */
function createDID() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            try {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var did, privateKey, publicKey, publicKeyb58, x25519key, x25519keyb58, didDocument, requestbody, url, responseMetadata;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    did = "did:monokee" + uuid.v4();
                                    privateKey = ed.utils.randomPrivateKey();
                                    return [4 /*yield*/, ed.getPublicKey(privateKey)];
                                case 1:
                                    publicKey = _a.sent();
                                    publicKeyb58 = bs58.encode(publicKey);
                                    return [4 /*yield*/, ed.getSharedSecret(privateKey, publicKey)];
                                case 2:
                                    x25519key = _a.sent();
                                    x25519keyb58 = bs58.encode(x25519key);
                                    return [4 /*yield*/, createDidDocument(did, publicKeyb58, x25519keyb58)];
                                case 3:
                                    didDocument = _a.sent();
                                    return [4 /*yield*/, createRequestBody(didDocument, privateKey)];
                                case 4:
                                    requestbody = _a.sent();
                                    url = "http://localhost:8080/createdid";
                                    (0, node_fetch_1["default"])(url);
                                    return [4 /*yield*/, (0, node_fetch_1["default"])(url, {
                                            method: 'post',
                                            body: JSON.stringify(requestbody),
                                            headers: { 'Content-Type': 'application/json' }
                                        })["catch"](function () {
                                            reject("error on post request");
                                        }).body];
                                case 5:
                                    responseMetadata = _a.sent();
                                    console.log(responseMetadata);
                                    resolve(did);
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            }
            catch (error) {
                console.log("Error occurred in createDID function ".concat(error)); //logger could be better
                throw error;
            }
            return [2 /*return*/];
        });
    });
}
exports.createDID = createDID;
/**
 * create the request body for the api POST call
 * @param document
 * @param privateKey
 * @returns the body that has to be attached to the api POST request
 */
function createRequestBody(didDocument, privateKey) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                    var json, message, signature, encodedSignature, ret;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                json = JSON.stringify(didDocument);
                                message = Buffer.from(json);
                                return [4 /*yield*/, ed.sign(message, privateKey)];
                            case 1:
                                signature = _a.sent();
                                encodedSignature = bs58.encode(signature);
                                ret = {
                                    didDocument: didDocument,
                                    signature: encodedSignature
                                };
                                //var string = new TextDecoder().decode(arr); //test the encode
                                resolve(ret);
                                return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
/**
 * creates the DID docuemnt data structure
 * @param did
 * @param pubked
 * @param pubkx
 * @returns the data structure with the complete didDocument
 */
function createDidDocument(did, pubked, pubkx) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                    var vm1, vm2, document;
                    return __generator(this, function (_a) {
                        vm1 = {
                            id: did + "#key-1",
                            type: "Ed25519VerificationKey2018",
                            controller: did,
                            publicKeyBase58: pubked
                        };
                        vm2 = {
                            id: did + "#key-2",
                            type: "X25519KeyAgreementKey2019",
                            controller: did,
                            publicKeyBase58: pubkx
                        };
                        document = {
                            '@context': 'https://www.w3.org/ns/did/v1',
                            id: did,
                            verificationMethod: [vm1, vm2],
                            authentication: [vm1.id],
                            assertionMethod: [vm1.id],
                            keyAgreement: [vm2.id]
                        };
                        resolve(document);
                        return [2 /*return*/];
                    });
                }); })];
        });
    });
}

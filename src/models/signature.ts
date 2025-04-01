import crypto from "crypto";
import { TOLERANCE_ZONE } from "../constants.js"

export interface SignatureProps {
    secret: string;
    receivedSignature: string | string[];
    timestamp: string | string[];
    rawPayload: string;
}

export class SignatureModel {
    private secret: string;
    private receivedSignature: string | string[];
    private timestamp: string | string[];
    private rawPayload: string;

    constructor({ secret, receivedSignature, timestamp, rawPayload }: SignatureProps) {
        this.secret = secret;
        this.receivedSignature = receivedSignature;
        this.timestamp = timestamp;
        this.rawPayload = rawPayload;

    }

    private calculateSignature() {
        const hmac = crypto
            .createHmac("sha256", this.secret)
            .update(this.payloadToSign())
            .digest("hex")
        return `${this.revolutSignatureVersion()}=${hmac}`
    }

    private payloadToSign() {
        return `${this.revolutSignatureVersion()}.${this.timestamp}.${this.rawPayload}`
    }

    private revolutSignatureVersion() {
        const signature = Array.isArray(this.receivedSignature) 
            ? this.receivedSignature[0] 
            : this.receivedSignature;
        return signature.substring(0, this.receivedSignature.indexOf("="))
    }

    isSignatureValid(): boolean {
        return this.calculateSignature() === this.receivedSignature
    }

    isTimestampValid(): boolean {
        const currentTimestamp = Date.now();
        const ts = Array.isArray(this.timestamp)
            ? this.timestamp[0]
            : this.timestamp
        const difference = currentTimestamp - Number(ts);
        return difference >= 0 && difference <= TOLERANCE_ZONE;
    }

}
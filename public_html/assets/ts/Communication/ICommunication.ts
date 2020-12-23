import { IPartner } from "../Partner/IPartner.js";

export interface ICommunication{

    getPeerConnection(): RTCPeerConnection;

    addOnicecandidateEvent(callback: (candidate: any, partner: IPartner) => void): void; 

    addOnaddtrackEvent(callback: (stream: any, partner: IPartner) => void): void;

    addConnectionLosedEvent(callback: (partner: IPartner) => void): void;

    addConnectionEvent(callback: (partner: IPartner) => void): void;

}
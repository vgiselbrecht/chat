
import { IExchange } from "./IExchange";
import {default as config} from "../../../config"
import { Alert } from "../Elements/Alert";

declare var firebase: any; 

export class Firebase implements IExchange{

    firebaseConfig = config.exchangeServices.firebase;

    roomDatabase: any;
    ownDatabase: any;
    partnerDatbases: {} = {};
    room: string;
    yourId: number;
    isAuthenticated: boolean = false;
    readCallback: (sender: number, dataroom: string, msg: any) => void;

    constructor(room: string, yourId: number, authenticated: () => void){
        var cla = this;
        this.room = room;
        this.yourId = yourId;
        firebase.initializeApp(this.firebaseConfig);
        firebase.analytics();
        firebase.auth().signInAnonymously()
            .then(() => {
                cla.roomDatabase = firebase.database().ref('rooms/' + room + "/partners/all");
                cla.ownDatabase = firebase.database().ref('rooms/' + room + "/partners/" + yourId);
                cla.isAuthenticated = true;
                authenticated();
            })
            .catch((error) => {
                console.log(error);
                new Alert("Autentifizierungsfehler bei Firebase!<br>Die Seite muss neu geladen werden!");
            });
    }

    
    sendMessage(data: any, receiver: number = 0): void{
        var cla = this;
        if(cla.isAuthenticated){
            cla.sendMessageInner(data, receiver);
        } else{
            var authIntervall = setInterval(function(){
                if(cla.isAuthenticated){
                    cla.sendMessageInner(data, receiver);
                    clearInterval(authIntervall);
                }
            }, 100)
        }
    }

    sendMessageInner(data: any, receiver: number = 0){
        console.log("Exchange message to: " + (receiver !== 0 ? receiver : 'all'))
        console.log(data)
        var ref = this.getDatabaseRef(receiver);
        var msg = ref.push({ room: this.room, sender: this.yourId, receiver: receiver, message: JSON.stringify(data) });
        msg.remove();
    }

    readMessage(data, cla) {
        if(data.val().message){
            var msg = JSON.parse(data.val().message);
            var sender = data.val().sender;
            var receiver = data.val().receiver;
            var dataroom = data.val().room;
            if (dataroom === cla.room && sender !== cla.yourId && (receiver == 0 || receiver == cla.yourId)) {
                cla.readCallback(sender, dataroom, msg);
            }
        } else {
            console.log("Wrong data from firebase!: ");
            console.log(data.val());
        }
    }
 
    addReadEvent(callback: (sender: number, dataroom: string, msg: any) => void): void{
        this.readCallback = callback;
        let cla = this;
        this.roomDatabase.on('child_added', function(data: any) {
            cla.readMessage(data, cla)
        });
        this.ownDatabase.on('child_added', function(data: any) {
            cla.readMessage(data, cla)
        });
    }

    closeConnection(): void{
        this.roomDatabase.off();
        this.ownDatabase.off();
        for(var receiverid in this.partnerDatbases){
            this.partnerDatbases[receiverid].off();
        }
    }

    getDatabaseRef(receiver: number = 0){
        if(receiver === 0){
            return this.roomDatabase;
        }
        if(receiver in this.partnerDatbases){
            return this.partnerDatbases[receiver];
        }
        this.partnerDatbases[receiver] = firebase.database().ref('rooms/' + this.room + "/partners/" + receiver);
        return this.partnerDatbases[receiver];
    }

}
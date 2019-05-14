import alt from 'alt';
import game from 'natives';

let localPlayer = alt.getLocalPlayer();

//Fingerpointing
export default class Fingerpointing {
    constructor(){
        this.active = false;
        this.interval = null;
        this.cleanStart = false;
        this.gameplayCam = game.createCameraWithParams("gameplay");
    }

        start () {
            if (!this.active) {
                this.active = true;

                this.requestAnimDictPromise("anim@mp_point").then(()=>{
                    game.setPedCurrentWeaponVisible(localPlayer.scriptID, 0, 1, 1, 1);
                    game.setPedConfigFlag(localPlayer.scriptID, 36, true);
                    game.taskMoveNetwork(localPlayer.scriptID,"task_mp_pointing", 0.5, false, "anim@mp_point", 24);
                    //game.taskPlayAnim(localPlayer.scriptID,"anim@mp_point", "task_mp_pointing", 8.0, 1, -1, 24, 0, 0, 0, 0);
                    game.removeAnimDict("anim@mp_point");
                    this.cleanStart = true;
                    this.interval = alt.setInterval(this.process.bind(this), 0);
                }).catch(()=>{alt.log('Promise returned reject Pointing')});

            }
        }

        stop() {
            if (this.active) {
                if(this.interval){
                    alt.clearInterval(this.interval);
                }
                this.interval = null;

                this.active = false;

                if(this.cleanStart){
                    this.cleanStart = false;
                    game.setNetworkTaskAction(localPlayer.scriptID, "Stop");

                    if (!game.isPedInjured(localPlayer.scriptID)) {
                        game.clearPedSecondaryTask(localPlayer.scriptID);
                    }
                    if (!game.isPedInAnyVehicle(localPlayer.scriptID, true)) {
                        game.setPedCurrentWeaponVisible(localPlayer.scriptID, 1, 1, 1, 1);
                    }
                    game.setPedConfigFlag(localPlayer.scriptID, 36, false);
                    game.clearPedSecondaryTask(localPlayer.scriptID);
                }
            }
        }




        getRelativePitch () {
            let camRot = game.getGameplayCamRot(2);
            return camRot.x - game.getEntityPitch(localPlayer.scriptID);
        }

        process () {
            if (this.active) {

                game.isTaskMoveScriptedActive(localPlayer.scriptID);

                let camPitch = this.getRelativePitch();

                if (camPitch < -70.0) {
                    camPitch = -70.0;
                }
                else if (camPitch > 42.0) {
                    camPitch = 42.0;
                }
                camPitch = (camPitch + 70.0) / 112.0;

                let camHeading = game.getGameplayCamRelativeHeading();

                //let cosCamHeading = Math.cos(camHeading); For raycasting not implemented currently
                //let sinCamHeading = Math.sin(camHeading); For raycasting not implemented currently

                if (camHeading < -180.0) {
                    camHeading = -180.0;
                }
                else if (camHeading > 180.0) {
                    camHeading = 180.0;
                }
                camHeading = (camHeading + 180.0) / 360.0;

                /*
                * For raycasting not implemented currently
                *
                *let coords = game.getOffsetFromEntityGivenWorldCoords((cosCamHeading * -0.2) - (sinCamHeading *
                *(0.4 * camHeading + 0.3)), (sinCamHeading * -0.2) + (cosCamHeading * (0.4 * camHeading + 0.3)), 0.6);
                *
                 */

                game.setNetworkTaskParamFloat(localPlayer.scriptID, "Pitch", camPitch);
                game.setNetworkTaskParamFloat(localPlayer.scriptID, "Heading", camHeading * -1.0 + 1.0);
                game.setNetworkTaskParamBool(localPlayer.scriptID, "isBlocked", 0);
                game.setNetworkTaskParamBool(localPlayer.scriptID, "isFirstPerson", game._0xEE778F8C7E1142E2(game._0x19CAFA3C87F7C2FF()) === 4);

            }
        }

    requestAnimDictPromise(dict) {
        game.requestAnimDict(dict);
        return new Promise((resolve, reject) => {
            let check = alt.setInterval(() => {

                if(game.hasAnimDictLoaded(dict))
                {
                    alt.clearInterval(check);
                    alt.log('Anim dict loaded');
                    resolve(true);
                } else {
                    alt.log('Requesting Animdict.');
                }

            },(5));
        });
    }
}



import * as alt from 'alt';
import * as game from 'natives';

class Fingerpointing {
	constructor() {
		this.active = false;
		this.interval = null;
		this.cleanStart = false;
		this.debounceTime = 150;
		this.lastBlockDate = null;
		this.localPlayer = alt.Player.local;
		this.registerEvents();
	}

	registerEvents() {
		alt.on('keydown', (key) => {
			if (key !== 66) return;
			this.start();
		});

		alt.on('keyup', (key) => {
			if (key !== 66) return;
			this.stop();
		});
	}

	async start() {
		if (this.active) return;
		this.active = true;
		try {
			await this.requestAnimDictPromise('anim@mp_point');
			game.setPedCurrentWeaponVisible(
				this.localPlayer.scriptID,
				false,
				true,
				true,
				true
			);
			game.setPedConfigFlag(this.localPlayer.scriptID, 36, true);
			game.taskMoveNetworkByName(
				this.localPlayer.scriptID,
				'task_mp_pointing',
				0.5,
				false,
				'anim@mp_point',
				24
			);
			this.cleanStart = true;
			this.interval = alt.setInterval(this.process.bind(this), 0);
		} catch (e) {
			alt.log(e);
		}
	}

	stop() {
		if (!this.active) return;
		if (this.interval) {
			alt.clearInterval(this.interval);
		}
		this.interval = null;

		this.active = false;

		if (!this.cleanStart) return;
		this.cleanStart = false;
		game.requestTaskMoveNetworkStateTransition(
			this.localPlayer.scriptID,
			'Stop'
		);

		if (!game.isPedInjured(this.localPlayer.scriptID)) {
			game.clearPedSecondaryTask(this.localPlayer.scriptID);
		}
		if (!this.localPlayer.vehicle) {
			game.setPedCurrentWeaponVisible(
				this.localPlayer.scriptID,
				true,
				true,
				true,
				true
			);
		}
		game.setPedConfigFlag(this.localPlayer.scriptID, 36, false);
		game.clearPedSecondaryTask(this.localPlayer.scriptID);
	}

	getRelativePitch() {
		let camRot = game.getGameplayCamRot(2);
		return camRot.x - game.getEntityPitch(this.localPlayer.scriptID);
	}

	process() {
		if (!this.active) return;
		let camPitch = this.getRelativePitch();
		if (camPitch < -70.0) {
			camPitch = -70.0;
		} else if (camPitch > 42.0) {
			camPitch = 42.0;
		}
		camPitch = (camPitch + 70.0) / 112.0;

		let camHeading = game.getGameplayCamRelativeHeading();
		let cosCamHeading = Math.cos(camHeading);
		let sinCamHeading = Math.sin(camHeading);

		if (camHeading < -180.0) {
			camHeading = -180.0;
		} else if (camHeading > 180.0) {
			camHeading = 180.0;
		}
		camHeading = (camHeading + 180.0) / 360.0;

		let coords = game.getOffsetFromEntityInWorldCoords(
			this.localPlayer.scriptID,
			cosCamHeading * -0.2 - sinCamHeading * (0.4 * camHeading + 0.3),
			sinCamHeading * -0.2 + cosCamHeading * (0.4 * camHeading + 0.3),
			0.6
		);
		let ray = game.startShapeTestCapsule(
			coords.x,
			coords.y,
			coords.z - 0.2,
			coords.x,
			coords.y,
			coords.z + 0.2,
			1.0,
			95,
			this.localPlayer.scriptID,
			7
		);
		let [_, blocked, coords1, coords2, entity] = game.getShapeTestResult(
			ray,
			false,
			null,
			null,
			null
		);
		if (blocked && this.lastBlockDate === null) {
			this.lastBlockDate = new Date();
		}
		game.setTaskMoveNetworkSignalFloat(
			this.localPlayer.scriptID,
			'Pitch',
			camPitch
		);
		game.setTaskMoveNetworkSignalFloat(
			this.localPlayer.scriptID,
			'Heading',
			camHeading * -1.0 + 1.0
		);

		//this is a debounce for isBlocked network signal to avoid flickering of the peds arm on fast raycast changes
		if (this.isBlockingAllowed()) {
			game.setTaskMoveNetworkSignalBool(
				this.localPlayer.scriptID,
				'isBlocked',
				blocked
			);
		}

		game.setTaskMoveNetworkSignalBool(
			this.localPlayer.scriptID,
			'isFirstPerson',
			game.getCamViewModeForContext(game.getCamActiveViewModeContext()) === 4
		);
	}

	isBlockingAllowed() {
		const isAllowed = new Date() - this.lastBlockDate > this.debounceTime;
		if (isAllowed) {
			this.lastBlockDate = null;
		}
		return isAllowed;
	}

	requestAnimDictPromise(dict) {
		game.requestAnimDict(dict);
		return new Promise((resolve, reject) => {
			let tries = 0;
			let check = alt.setInterval(() => {
				tries++;
				if (game.hasAnimDictLoaded(dict)) {
					alt.clearInterval(check);
					resolve(true);
				} else if (tries > 30) {
					alt.clearInterval(check);
					reject('Anim request wait limit reached');
				}
			}, 50);
		});
	}
}

export const FingerpointingInstance = new Fingerpointing();

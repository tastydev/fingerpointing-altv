import * as alt from 'alt';
import Fingerpointing from 'fingerpointing';

let pointing = new Fingerpointing();
alt.on('keydown', (key) => {
    if (key == 'B'.charCodeAt(0)) {
        pointing.start();
    }
});

alt.on('keyup', (key) => {
    if (key == 'B'.charCodeAt(0)) {
        pointing.stop();
    }
});

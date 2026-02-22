import Phaser from 'phaser';
import { auth } from '../config/firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import { AuthManager } from '../managers/AuthManager';

export class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        // Sprawdzamy, czy gracz ma zapamiętaną sesję
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Autologowanie: sesja istnieje!
                await AuthManager.prepareSessionAndGo(user, this);
            } else {
                // Brak sesji: idziemy do ekranu logowania
                this.scene.start('LoginScene');
            }
        });
    }
}
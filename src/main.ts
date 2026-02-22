// src/main.ts
// to do list:
// logowanie w internecie
// ranking online
// dni serii i nagrody za utrzymanie serii
// fortune wheel: extra points, longer bonus points, smaller  amount to win, etc.
// IQ level: slowly increasling by doing math, but can be reset by using hints (or by giving up and looking at the solution)
// IQ level: faster grow by doing special challenges (time-limited, no hints, etc.)
// IQ level: gives ability to build faster
// można zastąpić elementem talent lub potencjał: za ukończenie modułu +0,1 - powolny wzrost;
// uwaga! opuszczenie dnia nauki = -1 potencjału (lub IQ) 
// geometry tasks (drag and drop shapes to form a specific figure)
import './style.css';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { LoginScene } from './scenes/LoginScene';
import { MathScene } from './scenes/MathScene'; // Importujemy Twoją nową klasę
import { SettingsScene } from './scenes/SettingsScene'; // Importujemy klasę sceny ustawień

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    dom: {
        createContainer: true // Ważne dla inputu HTML!
    },
    scene: [BootScene, LoginScene, MathScene, SettingsScene] // Tutaj wykaz dostępnych scen, zaczynamy od BootScene
};

new Phaser.Game(config);
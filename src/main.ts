// src/main.ts
import './style.css';
import Phaser from 'phaser';
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
    scene: [MathScene, SettingsScene] // Tutaj wykaz dostępnych scen, zaczynamy od MathScene
};

new Phaser.Game(config);
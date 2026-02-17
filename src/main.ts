// src/main.ts
import './style.css';
import Phaser from 'phaser';
import { MathScene } from './scenes/MathScene'; // Importujemy Twoją nową klasę

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    dom: {
        createContainer: true // Ważne dla inputu HTML!
    },
    scene: [MathScene] // Tutaj wskazujemy pierwszą klasę: mathScene
};

new Phaser.Game(config);
// src/components/GameButton.ts
import Phaser from 'phaser';

export class GameButton extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;
    private color: number;

    constructor(
        scene: Phaser.Scene, 
        x: number, 
        y: number, 
        label: string, 
        color: number, 
        callback: () => void
    ) {
        super(scene, x, y);
        this.color = color;

        // 1. Rysowanie tła
        this.bg = scene.add.graphics();
        this.drawNormal();

        // 2. Tekst
        this.text = scene.add.text(0, 0, label, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 3. Dodanie do kontenera
        this.add([this.bg, this.text]);

        // 4. Interakcja
        this.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
        this.input!.cursor = 'pointer';

        // 5. Efekty najechania i kliknięcia
        this.on('pointerover', () => {
            scene.tweens.add({ targets: this, scale: 1.1, duration: 100 });
        });

        this.on('pointerout', () => {
            scene.tweens.add({ targets: this, scale: 1.0, duration: 100 });
        });

        this.on('pointerdown', () => {
            scene.tweens.add({
                targets: this,
                scale: 0.9,
                duration: 50,
                onComplete: callback // Tu odpala się funkcja, którą podasz
            });
        });

        scene.add.existing(this);
    }

    private drawNormal() {
        this.bg.clear();
        this.bg.fillStyle(this.color, 1);
        this.bg.fillRoundedRect(-60, -20, 120, 40, 10);
        this.bg.lineStyle(2, 0xffffff, 1);
        this.bg.strokeRoundedRect(-60, -20, 120, 40, 10);
    }

    public updateText(newText: string) {
        this.text.setText(newText);
    }
}
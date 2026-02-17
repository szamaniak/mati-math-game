// src/components/Einstein.ts
export class Einstein {
    private scene: Phaser.Scene;
    private sprite: Phaser.GameObjects.Image;
    private bubble: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;
    private speechEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        
        // Postać
        this.sprite = scene.add.image(120, 480, 'einstein')
            .setScale(0.2)
            .setDepth(1);

        // Grafika dymka
        this.bubble = scene.add.graphics({ fillStyle: { color: 0xd3d3d3 } }).setDepth(101);
        this.drawBubble();

        // Tekst w dymku
        this.text = scene.add.text(200, 330, '', {
            fontSize: '18px',
            color: '#000000',
            wordWrap: { width: 280 }
        }).setOrigin(0.5).setDepth(102);

        this.hide();
    }

    private drawBubble() {
        const bubbleX = 50;
        const bubbleY = 280;
        const width = 300;
        const height = 100;
        this.bubble.fillRoundedRect(bubbleX, bubbleY, width, height, 15);
        this.bubble.fillTriangle(70, 380, 80, 410, 110, 380);
    }

    say(message: string, duration: number = 3000) {
        if (this.speechEvent) this.speechEvent.remove();
        this.scene.tweens.killTweensOf([this.bubble, this.text]);

        this.text.setText(message);
        this.bubble.setVisible(true).setAlpha(1);
        this.text.setVisible(true).setAlpha(1);

        this.speechEvent = this.scene.time.delayedCall(duration, () => {
            this.scene.tweens.add({
                targets: [this.bubble, this.text],
                alpha: 0,
                duration: 300,
                onComplete: () => this.hide()
            });
        });
    }

    jump() {
        this.scene.tweens.add({
            targets: this.sprite,
            scale: 0.22,
            y: 450,
            duration: 100,
            yoyo: true,
            ease: 'Quad.out'
        });
    }

    spin() {
        this.scene.tweens.add({
            targets: this.sprite,
            angle: 360,
            duration: 500,
            ease: 'Cubic.easeOut'
        });
    }

    private hide() {
        this.bubble.setVisible(false);
        this.text.setVisible(false);
    }
}
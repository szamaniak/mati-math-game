// src/components/Einstein.ts
export class Einstein {
    private scene: Phaser.Scene;
    private sprite: Phaser.GameObjects.Image;
    private bubble: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;
    private speechEvent?: Phaser.Time.TimerEvent;

    public isTalking: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;        
        const height  = this.scene.scale.height;
        
        // Postać
        this.sprite = scene.add.image(120, 480, 'einstein')
            .setScale(0.2)
            .setDepth(1);

        // Grafika dymka
        this.bubble = scene.add.graphics().setDepth(101);

        // Tekst w dymku
        this.text = scene.add.text(0, 0, '', {
            fontSize: '18px',
            color: '#000000',
            wordWrap: { width: 260 },
            align: 'center'
        }).setOrigin(0.5).setDepth(102);

        // Ustawienie początkowej pozycji (zamiast sztywnych wartości w create)
        this.setPosition(120, height - 120);
        this.hide();
    }

    /**
     * Kluczowa metoda do dynamicznego przesuwania Einsteina
     * @param x Nowa pozycja X środka postaci
     * @param y Nowa pozycja Y środka postaci
     */
    public setPosition(x: number, y: number) {
        // 1. Przesuń postać
        this.sprite.setPosition(x, y);

        // 2. Wylicz pozycję dymka (nad głową Einsteina)
        const bubbleW = 300;
        const bubbleH = 100;
        const offsetX = -150; // Przesunięcie w lewo, by dymek był wycentrowany nad nim
        const offsetY = -220; // Przesunięcie w górę, by nie zasłaniał głowy

        const bX = x + offsetX;
        const bY = y + offsetY;

        // 3. Przerysuj dymek w nowym miejscu
        this.bubble.clear();
        this.bubble.fillStyle(0xd3d3d3, 1);
        this.bubble.fillRoundedRect(bX, bY, bubbleW, bubbleH, 15);
        
        // Trójkącik dymka (celuje w głowę Einsteina)
        this.bubble.fillTriangle(
            x - 20, bY + bubbleH,     // Lewy róg u podstawy dymka
            x + 20, bY + bubbleH,     // Prawy róg u podstawy dymka
            x, y - 100                // Szczyt trójkąta celujący w postać
        );

        // 4. Przesuń tekst do środka dymka
        this.text.setPosition(bX + bubbleW / 2, bY + bubbleH / 2);
    }

    private drawBubble() {
        const bubbleX = 50;
        const bubbleY = 280;
        const width = 300;
        const height = 100;
        this.bubble.clear(); // Warto dodać clear przed rysowaniem
        this.bubble.fillRoundedRect(bubbleX, bubbleY, width, height, 15);
        this.bubble.fillTriangle(70, 380, 80, 410, 110, 380);
    }

    say(message: string, duration: number = 3000) {
        if (this.speechEvent) this.speechEvent.remove();
        this.scene.tweens.killTweensOf([this.bubble, this.text]);

        this.isTalking = true; // Zaczyna mówić
        this.text.setText(message);
        this.bubble.setVisible(true).setAlpha(1);
        this.text.setVisible(true).setAlpha(1);

        this.speechEvent = this.scene.time.delayedCall(duration, () => {
            this.scene.tweens.add({
                targets: [this.bubble, this.text],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    this.hide();
                    this.isTalking = false; // Skończył mówić
                }
            });
        });
    }

    jump() {
        const startY = this.sprite.y; // Pobieramy aktualny Y
        this.scene.tweens.add({
            targets: this.sprite,
            scale: 0.22,
            y: startY - 30, // Skacze relatywnie do aktualnej pozycji
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
    // --- NOWE METODY NAPRAWIAJĄCE BŁĄD ---

    /** Włącza interaktywność na grafice Einsteina */
    setInteractive(config?: Phaser.Types.Input.InputConfiguration) {
        this.sprite.setInteractive(config);
        return this;
    }

    /** Pozwala nasłuchiwać na zdarzenia (np. 'pointerdown') bezpośrednio na Einsteinie */
    on(event: string, fn: Function, context?: any) {
        this.sprite.on(event, fn, context);
        return this;
    }

    /** Gettery pomocne do pozycjonowania Tooltipa w MathScene */
    get x() { return this.sprite.x; }
    get y() { return this.sprite.y; }

    private hide() {
        this.bubble.setVisible(false);
        this.text.setVisible(false);
        this.isTalking = false;
    }
}
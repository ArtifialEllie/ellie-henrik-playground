class Bubble {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + this.radius;
        this.radius = Math.random() * 10 + 5;
        this.speed = Math.random() * 1 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.5;
    }
    update() {
        this.y -= this.speed;
        this.x += this.vx;
        if (this.y < -this.radius) {
            this.y = canvas.height + this.radius;
            this.x = Math.random() * canvas.width;
        }
    }
    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        ctx.restore();
    }
}

class Seaweed {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.height = Math.random() * 100 + 50;
        this.width = Math.random() * 10 + 5;
        this.offset = Math.random() * Math.PI * 2;
        this.color = `hsl(${120 + Math.random() * 40}, 70%, ${30 + Math.random() * 20}%)`;
    }
    draw(time) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        const sway = Math.sin(time * 0.002 + this.offset) * 20;
        ctx.quadraticCurveTo(this.x + sway, this.y - this.height / 2, this.x, this.y - this.height);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
    }
}

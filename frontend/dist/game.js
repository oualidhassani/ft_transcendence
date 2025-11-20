import { sendMessage } from "./game_soket.js";
export function game_start(config, state, ctx) {
    const { canvas: c, paddle, ball } = config;
    const { paddles, ball: ballPos } = state;
    const scaleFactor = 0.5;
    const scaledCanvasWidth = c.width * scaleFactor;
    const scaledCanvasHeight = c.height * scaleFactor;
    ctx.clearRect(0, 0, scaledCanvasWidth, scaledCanvasHeight);
    ctx.beginPath();
    ctx.fillStyle = paddle.color;
    ctx.roundRect(paddles.left.x * scaleFactor, // Scaled X position
    paddles.left.y * scaleFactor, // Scaled Y position
    paddle.width * scaleFactor, // Scaled Width
    paddle.height * scaleFactor, // Scaled Height
    10 * scaleFactor // Scaled Corner Radius (optional)
    );
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.fillStyle = paddle.color;
    ctx.roundRect(paddles.right.x * scaleFactor, // Scaled X position
    paddles.right.y * scaleFactor, // Scaled Y position
    paddle.width * scaleFactor, // Scaled Width
    paddle.height * scaleFactor, // Scaled Height
    10 * scaleFactor // Scaled Corner Radius (optional)
    );
    ctx.fill();
    ctx.closePath();
    ;
    ctx.beginPath();
    ctx.fillStyle = ball.color;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3 * scaleFactor; // Scaled Line Width
    ctx.arc(ballPos.x * scaleFactor, // Scaled X position
    ballPos.y * scaleFactor, // Scaled Y position
    ball.radius * scaleFactor, // Scaled Radius
    0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
}
export function listenForInputLocal(gameId, playerId) {
    const moves = { left: { up: false, down: false }, right: { up: false, down: false } };
    console.log("listen for input");
    function handleKeyDown(event) {
        if (event.key === "ArrowUp") {
            moves.right.up = true;
        }
        else if (event.key === "ArrowDown") {
            moves.right.down = true;
        }
        else if (event.key === "w") {
            moves.left.up = true;
        }
        else if (event.key === "s") {
            moves.left.down = true;
        }
        else
            return;
        sendMessage("game_update", { gameId, playerId, input: { ...moves } });
    }
    function handleKeyUp(event) {
        if (event.key === "ArrowUp") {
            moves.right.up = false;
        }
        else if (event.key === "ArrowDown") {
            moves.right.down = false;
        }
        else if (event.key === "w") {
            moves.left.up = false;
        }
        else if (event.key === "s") {
            moves.left.down = false;
        }
        else
            return;
        sendMessage("game_update", { gameId, playerId, input: { ...moves } });
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keyup", handleKeyUp);
    };
}

package main

import (
    "math"
    "time"
    ws "../gotrongo"
)

const (
    FPS = 121       // Server speed can exceed client, that's fine
)

func main() {
    ws.RegisterSprite("resources/space ship.png")
    ws.RegisterSprite("resources/globe.png")
    ws.RegisterSound("resources/shot.wav")
    w, h := ws.Start(FPS)

    WIDTH, HEIGHT := float64(w), float64(h)

    var ticker = time.Tick(time.Second / FPS)

    var x, y, speedx, speedy, angle float64 = 100, 100, 0, 0, 0

    c := ws.NewCanvas()
    z := ws.NewSoundscape()

    for {

        c.Clear()
        z.Clear()       // Or sounds will play repeatedly every frame...

        if ws.KeyDown("w") && speedy > -2 && y > 16          { speedy -= 0.1 }
        if ws.KeyDown("a") && speedx > -2 && x > 16          { speedx -= 0.1 }
        if ws.KeyDown("s") && speedy <  2 && y < HEIGHT - 16 { speedy += 0.1 }
        if ws.KeyDown("d") && speedx <  2 && x <  WIDTH - 16 { speedx += 0.1 }

        if (x > WIDTH - 16 && speedx > 0) || (x < 16 && speedx < 0) {
            speedx *= -1
            z.PlaySound("resources/shot.wav")
        }
        if (y > HEIGHT - 16 && speedy > 0) || (y < 16 && speedy < 0) {
            speedy *= -1
            z.PlaySound("resources/shot.wav")
        }

        x += speedx
        y += speedy

        angle += 0.03
        orbiter_x := 50 * math.Cos(angle)
        orbiter_y := 50 * math.Sin(angle)

        c.AddLine("#ffff00", x, y, x + orbiter_x, y + orbiter_y, 0, 0)
        c.AddSprite("resources/space ship.png", x, y, speedx, speedy)
        c.AddSprite("resources/globe.png", x + orbiter_x, y + orbiter_y, 0, 0)
        c.AddText("Hello there: this works!", "#ffff00", 30, "Arial", x - orbiter_x, y - orbiter_y, 0, 0)

        <- ticker
        c.Send()
        z.Send()

        clicks := ws.PollClicks()
        if len(clicks) > 0 {
            last_click := clicks[len(clicks) - 1]
            ws.SendDebug("Click at %d, %d", last_click[0], last_click[1])
        }
    }
}

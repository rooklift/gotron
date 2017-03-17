package main

import (
    "time"
    engine "../gotrongo"
)

const (
    FPS = 121       // Server speed can exceed client, that's fine
)

func main() {

    // Set up the engine...

    engine.RegisterSprite("resources/space ship.png")
    engine.RegisterSound("resources/shot.wav")
    engine.Start(FPS)                           // FPS is advisory only. Very wrong values may cause visible stutter.

    width, height := engine.GetWidthHeightFloats()

    // Use a ticker to limit our framerate...

    var ticker = time.Tick(time.Second / FPS)

    // Create a canvas and a soundscape...

    c := engine.NewCanvas()
    z := engine.NewSoundscape()

    // Set up our space ship...

    var x, y, speedx, speedy float64 = 100, 100, 0, 0

    for {
        c.Clear()       // Clear both the canvas...
        z.Clear()       // ...and the soundscape (or sounds will repeat every frame)

        // Get the Window size, which can change...

        new_width, new_height := engine.GetWidthHeightFloats()
        if new_width != width || new_height != height {
            width = new_width
            height = new_height
            engine.SendDebug("Window size: %d, %d", int(width), int(height))
        }

        // Move with WASD keys...

        if engine.KeyDown("w") && speedy > -2 && y > 16          { speedy -= 0.1 }
        if engine.KeyDown("a") && speedx > -2 && x > 16          { speedx -= 0.1 }
        if engine.KeyDown("s") && speedy <  2 && y < height - 16 { speedy += 0.1 }
        if engine.KeyDown("d") && speedx <  2 && x <  width - 16 { speedx += 0.1 }

        // Capture mouse clicks...

        click := engine.GetClick()
        if click != nil {
            engine.SendDebug("Got click at %d, %d", click[0], click[1])
        }

        // Bounce off walls...

        if (x > width - 16 && speedx > 0) || (x < 16 && speedx < 0) {
            speedx *= -1
            z.PlaySound("resources/shot.wav")
        }
        if (y > height - 16 && speedy > 0) || (y < 16 && speedy < 0) {
            speedy *= -1
            z.PlaySound("resources/shot.wav")
        }

        // Update position and add sprite to the canvas

        x += speedx
        y += speedy
        c.AddSprite("resources/space ship.png", x, y, speedx, speedy)   // Speed values used for interpolation if needed

        // Wait for next tick, then send info to the client window

        <- ticker
        c.Send()
        z.Send()
    }
}

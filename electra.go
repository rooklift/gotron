package main

import (
    "fmt"
    "math"
    "math/rand"
    "time"
    ws "./gotrongo"
)

const (
    FPS = 121
    WIDTH = 1000
    HEIGHT = 680

    SUBLINES = 40
    RAND_DIST = 40
    RADIUS = 380
)

type Line struct {
    x1 float64
    y1 float64
    x2 float64
    y2 float64
}

func main() {
    ws.RegisterSprite("resources/globe.png")
    ws.RegisterSound("resources/shot.wav")
    ws.Start(WIDTH, HEIGHT, FPS)

    var ticker = time.Tick(time.Second / FPS)

    var centre_x float64 = WIDTH / 2
    var centre_y float64 = HEIGHT / 2

    c := ws.NewCanvas()
    z := ws.NewSoundscape()

    var angle float64
    var additive float64 = 0.005
    var i int

    var lines []Line

    for {
        i++
        c.Clear()
        z.Clear()

        angle += additive
        orbiter1_x := centre_x + RADIUS * math.Cos(angle)
        orbiter1_y := centre_y + RADIUS * math.Sin(angle)
        orbiter2_x := centre_x - RADIUS * math.Cos(angle)
        orbiter2_y := centre_y - RADIUS * math.Sin(angle)

        var x, y float64 = orbiter1_x, orbiter1_y
        var next_x, next_y float64

        if i % 5 == 0 {

            lines = nil

            for n := 0 ; n < SUBLINES ; n++ {

                vecx, vecy := unit_vector(x, y, orbiter2_x, orbiter2_y)

                dx := orbiter2_x - x
                dy := orbiter2_y - y
                distance := math.Sqrt(dx * dx + dy * dy)

                if n == SUBLINES - 1 {
                    next_x = orbiter2_x
                    next_y = orbiter2_y
                } else {
                    next_x = x + (vecx * distance / (SUBLINES - float64(n))) + (rand.Float64() * RAND_DIST) - (RAND_DIST / 2)
                    next_y = y + (vecy * distance / (SUBLINES - float64(n))) + (rand.Float64() * RAND_DIST) - (RAND_DIST / 2)
                }

                lines = append(lines, Line{x, y, next_x, next_y})

                x = next_x
                y = next_y
            }
        }

        for _, line := range lines {
            c.AddLine("#00ccff", line.x1, line.y1, line.x2, line.y2, 0, 0)
        }

        c.AddSprite("resources/globe.png", orbiter1_x, orbiter1_y, 0, 0)
        c.AddSprite("resources/globe.png", orbiter2_x, orbiter2_y, 0, 0)

        clicks := ws.PollClicks()
        if len(clicks) > 0 {
            ws.SendDebug(fmt.Sprintf("Click at %d, %d", clicks[len(clicks) - 1][0], clicks[len(clicks) - 1][1]))
        }

        if ws.KeyDownClear("space") {
            additive *= -1
            z.PlaySound("resources/shot.wav")
        }

        <- ticker
        c.Send()
        z.Send()
    }
}

func unit_vector(x1, y1, x2, y2 float64) (float64, float64) {
    dx := x2 - x1
    dy := y2 - y1

    if (dx == 0 && dy == 0) {
        return 0, 0
    }

    distance := math.Sqrt(dx * dx + dy * dy)
    return dx / distance, dy / distance
}

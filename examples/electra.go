package main

import (
	"math"
	"math/rand"

	engine "../gotrongo"
)

const (
	SUBLINES = 40
	RAND_DIST = 40
)

type Line struct {
	x1 float64
	y1 float64
	x2 float64
	y2 float64
}

func main() {
	engine.RegisterSprite("resources/globe.png")
	engine.RegisterSound("resources/shot.wav")
	engine.Start(60)

	c := engine.NewCanvas()
	z := engine.NewSoundscape()

	var angle float64
	var additive float64 = 0.005
	var i int

	var lines []Line

	for {
		i++
		c.Clear()
		z.Clear()

		width, height := engine.GetWidthHeightFloats()
		radius := height / 2

		var centre_x float64 = float64(width) / 2
		var centre_y float64 = float64(height) / 2

		angle += additive
		orbiter1_x := centre_x + radius * math.Cos(angle)
		orbiter1_y := centre_y + radius * math.Sin(angle)
		orbiter2_x := centre_x - radius * math.Cos(angle)
		orbiter2_y := centre_y - radius * math.Sin(angle)

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

		if engine.KeyDownClear("space") {
			additive *= -1
			z.PlaySound("resources/shot.wav")
		}

		engine.Sync()
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

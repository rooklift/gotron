package main

// Super slow

import (
	"math/rand"

	engine "../gotrongo"
)

const (
	FPS = 60
	SIZE = 10
)

func main() {

	engine.Start(FPS)

	width, height := engine.GetWidthHeightFloats()
	c := engine.NewCanvas()

	for {
		c.Clear()

		for x := 0.0; x < width; x += SIZE {
			for y := 0.0; y < height; y += SIZE {
				var col string
				if rand.Intn(2) == 0 {
					col = "red"
				} else {
					col = "black"
				}
				c.AddFrect(col, x, y, x + SIZE, y + SIZE, 0, 0)
			}
		}

		engine.Sync()
		c.Send()
	}
}

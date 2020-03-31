package main

// Super slow

import (
	"math/rand"
	"time"

	engine "../gotrongo"
)

const (
	FPS = 60
)

func main() {

	engine.Start(FPS)

	width, height := engine.GetWidthHeightFloats()
	ticker := time.Tick(time.Second / FPS)
	c := engine.NewCanvas()

	for {
		c.Clear()

		for x := 0.0; x < width; x += 3 {
			for y := 0.0; y < height; y += 3 {
				var col string
				if rand.Intn(2) == 0 {
					col = "red"
				} else {
					col = "black"
				}
				c.AddFrect(col, x, y, x + 3, y + 3, 0, 0)
			}
		}

		<- ticker
		c.Send()
	}
}

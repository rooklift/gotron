package main

import (
	"fmt"
	"math/rand"
	engine "../gotrongo"
)

const (
	FPS = 40
)

func main() {

	// Set up the engine...

	engine.RegisterSprite("resources/space ship.png")
	engine.RegisterSound("resources/shot.wav")
	engine.Start(FPS)                           // FPS is advisory only. Very wrong values may cause visible stutter.

	width, height := engine.GetWidthHeightFloats()

	// Create a canvas...

	c := engine.NewCanvas()

	show_x := 0
	show_y := 0

	for {
		c.Clear()       // Clear both the canvas...

		// Get the Window size, which can change...

		new_width, new_height := engine.GetWidthHeightFloats()
		if new_width != width || new_height != height {
			width = new_width
			height = new_height
		}

		for x := 0; x < int(width); x += 12 {
			for y := 0; y < int(height); y += 18 {
				s := fmt.Sprintf("%d", rand.Intn(10))

				if x == show_x && y == show_y {
					c.AddText(s, "#00ff00", 18, "Courier", float64(x), float64(y), 0, 0)
				} else {
					c.AddText(s, "#666666", 18, "Courier", float64(x), float64(y), 0, 0)
				}
			}
		}

		c.Send()

		show_x += 12
		if show_x >= int(width) {
			show_x = 0
			show_y += 18
			if show_y >= int(height) {
				show_y = 0
			}
		}
	}
}

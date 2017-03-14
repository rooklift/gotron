package main

import (
    "fmt"
    "time"
)

func main() {

    x := 50.0
    y := 50.0

    fmt.Printf("r\x1eresources/space ship.png\x1fsprite1\n")

    for {
        x += 1
        y += 1
        fmt.Printf("v\x1es\x1f%s\x1f%.1f\x1f%.1f\x1f%.1f\x1f%.1f\n", "sprite1", x, y, 62.5, 62.5)
        time.Sleep(16 * time.Millisecond)
    }
}

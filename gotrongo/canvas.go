package wsworld

import (
    "fmt"
    "strings"
    "sync"
)

// ---------------------------------------- CANVAS ----------------------------------------

type Canvas struct {
    mutex           sync.Mutex
    entities        []string
}

func NewCanvas() *Canvas {
    ret := new(Canvas)
    ret.Clear()
    return ret
}

func (w *Canvas) Clear() {

    w.mutex.Lock()
    defer w.mutex.Unlock()

    w.entities = []string{"v"}
}

func (w *Canvas) Send() {

    w.mutex.Lock()
    defer w.mutex.Unlock()

    // The following fixes things if the app uses new(Canvas) instead of NewCanvas()

    if len(w.entities) == 0 {
        w.Clear()
    }
    if w.entities[0] != "v" {
        w.entities = append([]string{"v"}, w.entities...)
    }

    s := strings.Join(w.entities, "\x1e") + "\n"
    fmt.Printf(s)
}

func (w *Canvas) AddPoint(colour string, x, y, speedx, speedy float64) {

    w.mutex.Lock()
    defer w.mutex.Unlock()

    w.entities = append(w.entities, fmt.Sprintf("p\x1f%s\x1f%.1f\x1f%.1f\x1f%.1f\x1f%.1f", colour, x, y, speedx * eng.fps, speedy * eng.fps))
}

func (w *Canvas) AddSprite(filename string, x, y, speedx, speedy float64) {

    w.mutex.Lock()
    defer w.mutex.Unlock()

    varname := eng.sprites[filename]        // Safe to read without mutex since there are no writes any more
    w.entities = append(w.entities, fmt.Sprintf("s\x1f%s\x1f%.1f\x1f%.1f\x1f%.1f\x1f%.1f", varname, x, y, speedx * eng.fps, speedy * eng.fps))
}

func (w *Canvas) AddLine(colour string, x1, y1, x2, y2, speedx, speedy float64) {

    w.mutex.Lock()
    defer w.mutex.Unlock()

    w.entities = append(w.entities, fmt.Sprintf("l\x1f%s\x1f%.1f\x1f%.1f\x1f%.1f\x1f%.1f\x1f%.1f\x1f%.1f", colour, x1, y1, x2, y2, speedx * eng.fps, speedy * eng.fps))
}

func (w *Canvas) AddText(text, colour string, size int, font string, x, y, speedx, speedy float64) {

    w.mutex.Lock()
    defer w.mutex.Unlock()

    text = strings.Replace(text, "\x1e", " ", -1)       // Replace meaningful characters in our protocol
    text = strings.Replace(text, "\x1f", " ", -1)
    text = strings.Replace(text, "\n", " ", -1)
    w.entities = append(w.entities, fmt.Sprintf("t\x1f%s\x1f%d\x1f%s\x1f%.1f\x1f%.1f\x1f%.1f\x1f%.1f\x1f%s", colour, size, font, x, y, speedx, speedy, text))
}

// ---------------------------------------- SOUNDS ----------------------------------------

type Soundscape struct {
    mutex           sync.Mutex
    soundqueue      []string
}

func NewSoundscape() *Soundscape {
    ret := new(Soundscape)
    ret.Clear()
    return ret
}

func (z *Soundscape) Clear() {
    z.mutex.Lock()
    defer z.mutex.Unlock()
    z.soundqueue = []string{"a"}
}

func (z *Soundscape) Send() {

    z.mutex.Lock()
    defer z.mutex.Unlock()

    // The following fixes things if the app uses new(Soundscape) instead of NewSoundscape()

    if len(z.soundqueue) == 0 {
        z.Clear()
    }
    if z.soundqueue[0] != "a" {
        z.soundqueue = append([]string{"a"}, z.soundqueue...)
    }

    s := strings.Join(z.soundqueue, "\x1e") + "\n"
    if len(s) > 2 {                                     // The first two bytes being "a "
        fmt.Printf(s)
    }
}

func (z *Soundscape) PlaySound(filename string) {

    z.mutex.Lock()
    defer z.mutex.Unlock()

    if len(z.soundqueue) >= 32 {
        return
    }

    varname := eng.sounds[filename]         // Safe to read without mutex since there are no writes any more
    if varname == "" {
        return
    }
    z.soundqueue = append(z.soundqueue, varname)
}

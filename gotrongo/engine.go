package wsworld

import (
    "fmt"
    "html/template"
    "strings"
    "sync"
)

var eng engine

func init() {
    eng.sprites = make(map[string]string)
    eng.sounds = make(map[string]string)
    eng.keyboard = make(map[string]bool)
}

type engine struct {

    mutex           sync.Mutex

    // The following are written once only...

    started         bool
    fps             float64

    // The following are written several times at the beginning, then only read from...

    sprites         map[string]string       // filename -> JS varname
    sounds          map[string]string       // filename -> JS varname

    // Written often...

    keyboard        map[string]bool
    clicks          [][]int
}

func RegisterSprite(filename string) {

    eng.mutex.Lock()
    defer eng.mutex.Unlock()

    if eng.started {
        panic("RegisterSprite(): already started")
    }

    sprite_id := len(eng.sprites)

    eng.sprites[filename] = fmt.Sprintf("sprite%d", sprite_id)
    fmt.Printf("r\x1e%s\x1fsprite%d\n", filename, sprite_id)
}

func RegisterSound(filename string) {

    eng.mutex.Lock()
    defer eng.mutex.Unlock()

    if eng.started {
        panic("RegisterSound(): already started")
    }

    sound_id := len(eng.sounds)

    eng.sounds[filename] = fmt.Sprintf("sound%d", sound_id)
    fmt.Printf("s\x1e%s\x1fsound%d\n", filename, sound_id)
}

func Start(width, height int, fps float64) {

    eng.mutex.Lock()            // Really just for the .started var
    defer eng.mutex.Unlock()

    if eng.started {
        panic("wsengine.Start(): already started")
    }

    eng.started = true
    eng.fps = fps

    go stdin_reader()
}

func KeyDown(key string) bool {
    return _keydown(key, false)
}

func KeyDownClear(key string) bool {       // Clears the key after (sets it to false)
    return _keydown(key, true)
}

func _keydown(key string, clear bool) bool {
    eng.mutex.Lock()
    defer eng.mutex.Unlock()

    ret := eng.keyboard[key]

    if clear {
        eng.keyboard[key] = false
    }

    return ret
}

func PollClicks() [][]int {

    // Return a slice containing every click since the last time this function was called.
    // Then clear the clicks from memory.

    eng.mutex.Lock()
    defer eng.mutex.Unlock()

    var ret [][]int

    for n := 0 ; n < len(eng.clicks) ; n++ {
        p := []int{eng.clicks[n][0], eng.clicks[n][1]}    // Each element is a length-2 slice of x,y.
        ret = append(ret, p)
    }

    eng.clicks = nil

    return ret
}

func SendDebug(format_string string, args ...interface{}) {

    msg := fmt.Sprintf(format_string, args...)

    msg = strings.Replace(msg, "\x1e", " ", -1)       // Replace meaningful characters in our protocol
    msg = strings.Replace(msg, "\x1f", " ", -1)
    msg = strings.Replace(msg, "\n", " ", -1)

    final := "d\x1e" + template.HTMLEscapeString(msg) + "\n"

    eng.mutex.Lock()
    defer eng.mutex.Unlock()

    fmt.Printf(final)
}

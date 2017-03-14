package wsworld

import (
    "fmt"
    "html/template"
    "os"
    "strings"
    "sync"
)

var eng engine

func init() {
    eng.sprites = make(map[string]string)
    eng.sounds = make(map[string]string)
    eng.players = make(map[int]*player)
}

type engine struct {

    mutex           sync.Mutex

    // The following are written once only...

    started         bool
    fps             float64
    res_path_local  string
    title           string
    static          string
    multiplayer     bool

    // The following are written several times at the beginning, then only read from...

    sprites         map[string]string       // filename -> JS varname
    sounds          map[string]string       // filename -> JS varname

    // Written often...

    players         map[int]*player
    latest_player   int
}

type player struct {
    pid             int
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

    eng.sounds[filename] = fmt.Sprintf("sound%d", len(eng.sounds))
}

func Start(title string, width, height int, fps float64) {

    eng.mutex.Lock()            // Really just for the .started var
    defer eng.mutex.Unlock()

    if eng.started {
        panic("wsengine.Start(): already started")
    }

    eng.started = true

    eng.title = title
    eng.fps = fps
    eng.multiplayer = false

    go stdin_reader()
}

func KeyDown(pid int, key string) bool {
    return _keydown(pid, key, false)
}

func KeyDownClear(pid int, key string) bool {       // Clears the key after (sets it to false)
    return _keydown(pid, key, true)
}

func _keydown(pid int, key string, clear bool) bool {
    eng.mutex.Lock()
    defer eng.mutex.Unlock()

    if pid == -1 {
        pid = eng.latest_player
    }

    if eng.players[pid] == nil {
        return false
    }

    ret := eng.players[pid].keyboard[key]

    if clear {
        eng.players[pid].keyboard[key] = false
    }

    return ret
}

func PollClicks(pid int) [][]int {

    // Return a slice containing every click since the last time this function was called.
    // Then clear the clicks from memory.

    eng.mutex.Lock()
    defer eng.mutex.Unlock()

    if pid == -1 {
        pid = eng.latest_player
    }

    var ret [][]int

    if eng.players[pid] == nil {
        return ret
    }

    for n := 0 ; n < len(eng.players[pid].clicks) ; n++ {
        p := []int{eng.players[pid].clicks[n][0], eng.players[pid].clicks[n][1]}    // Each element is a length-2 slice of x,y.
        ret = append(ret, p)
    }

    eng.players[pid].clicks = nil

    return ret
}

func PlayerCount() int {

    eng.mutex.Lock()
    defer eng.mutex.Unlock()

    return len(eng.players)
}

func PlayerSet() map[int]bool {

    eng.mutex.Lock()
    defer eng.mutex.Unlock()

    set := make(map[int]bool)

    for key, _ := range eng.players {       // Relies on us actually deleting players when they leave, not just setting them to nil
        set[key] = true
    }

    return set
}

func SendDebugToAll(msg string) {

    msg = strings.Replace(msg, "\x1e", " ", -1)       // Replace meaningful characters in our protocol
    msg = strings.Replace(msg, "\x1f", " ", -1)

    b := []byte("d\x1e" + template.HTMLEscapeString(msg))

    eng.mutex.Lock()
    defer eng.mutex.Unlock()

    os.Stdout.Write(b)
}

func slash_at_both_ends(s string) string {
    if strings.HasPrefix(s, "/") == false {
        s = "/" + s
    }
    if strings.HasSuffix(s, "/") == false {
        s = s + "/"
    }
    return s
}

package main

import (
    "math"
    "math/rand"
    "time"

    ws "../gotrongo"
)

const (
    FPS = 60
    QUEENS = 8
    BEASTS = 1900
    BEAST_MAX_SPEED = 7
    QUEEN_MAX_SPEED = 5.5
    BEAST_ACCEL_MODIFIER = 0.55
    QUEEN_ACCEL_MODIFIER = 0.7
    QUEEN_TURN_PROB = 0.001
    BEAST_TURN_PROB = 0.002
    AVOID_STRENGTH = 4000
    MAX_PLAYER_SPEED = 10
    MARGIN = 50
)

const (
    QUEEN = iota
    BEAST
)

type Sim struct {
    queens []*Dood
    beasts []*Dood
    player *Player
}

type Dood struct {
    x float64
    y float64
    speedx float64
    speedy float64
    species int
    target *Dood
    sim *Sim
}

type Player struct {
    x float64
    y float64
    speedx float64
    speedy float64
}

var WIDTH, HEIGHT float64

func main() {

    ws.RegisterSprite("resources/space ship.png")
    w, h := ws.Start(FPS)

    WIDTH, HEIGHT = float64(w), float64(h)

    rand.Seed(time.Now().UTC().UnixNano())

    var ticker = time.Tick(time.Second / FPS)

    s := Sim{}
    s.Init()

    c := ws.NewCanvas()

    for {
        s.Iterate()
        c.Clear()
        s.Draw(c)

        <- ticker

        c.Send()
    }
}

func (s *Sim) Init() {

    newplayer := new(Player)
    newplayer.x = WIDTH / 2
    newplayer.y = HEIGHT / 2
    s.player = newplayer

    for n := 0 ; n < QUEENS ; n++ {
        s.queens = append(s.queens, &Dood{WIDTH / 2, HEIGHT / 2, 0, 0, QUEEN, nil, s})
    }

    for n := 0 ; n < BEASTS ; n++ {
        s.beasts = append(s.beasts, &Dood{WIDTH / 2, HEIGHT / 2, 0, 0, BEAST, nil, s})
    }
}

func (s *Sim) Reset() {

    s.player.x = WIDTH / 2
    s.player.y = HEIGHT / 2
    s.player.speedx = 0
    s.player.speedy = 0

    for n := 0 ; n < QUEENS ; n++ {
        s.queens[n].x = WIDTH / 2
        s.queens[n].y = HEIGHT / 2
        s.queens[n].speedx = 0
        s.queens[n].speedy = 0
        s.queens[n].target = nil
    }

    for n := 0 ; n < BEASTS ; n++ {
        s.beasts[n].x = WIDTH / 2
        s.beasts[n].y = HEIGHT / 2
        s.beasts[n].speedx = 0
        s.beasts[n].speedy = 0
        s.beasts[n].target = nil
    }
}

func (s *Sim) Iterate() {

    for _, d := range s.beasts {
        d.Move()
    }
    for _, d := range s.queens {
        d.Move()
    }
    s.player.Move()

    if ws.KeyDownClear("r") {
        s.Reset()
        ws.SendDebug("Reset by Player")
    }
}

func (s *Sim) Draw(c *ws.Canvas) {

    for _, dood := range s.beasts {
        c.AddPoint("#00ff00", dood.x, dood.y, dood.speedx, dood.speedy)
    }

    c.AddSprite("resources/space ship.png", s.player.x, s.player.y, s.player.speedx, s.player.speedy)
}

func (p *Player) Move() {

    x, y, speedx, speedy := p.x, p.y, p.speedx, p.speedy

    // Respond to input...

    if ws.KeyDown("w") { speedy -= 0.2 }
    if ws.KeyDown("a") { speedx -= 0.2 }
    if ws.KeyDown("s") { speedy += 0.2 }
    if ws.KeyDown("d") { speedx += 0.2 }

    if ws.KeyDown("space") {
        if speedx < 0.1 && speedx > -0.1 {
            speedx = 0
        } else {
            speedx *= 0.95
        }
        if speedy < 0.1 && speedy > -0.1 {
            speedy = 0
        } else {
            speedy *= 0.95
        }
    }

    // Bounce off walls...

    if (x < 16 && speedx < 0) || (x >  WIDTH - 16 && speedx > 0) { speedx *= -1 }
    if (y < 16 && speedy < 0) || (y > HEIGHT - 16 && speedy > 0) { speedy *= -1 }

    // Throttle speed...

    speed := math.Sqrt(speedx * speedx + speedy * speedy)

    if speed > MAX_PLAYER_SPEED {
        speedx *= MAX_PLAYER_SPEED / speed
        speedy *= MAX_PLAYER_SPEED / speed
    }

    // Update entity...

    p.speedx = speedx
    p.speedy = speedy
    p.x += speedx
    p.y += speedy
}

func (d *Dood) Move() {

    x, y, speedx, speedy := d.x, d.y, d.speedx, d.speedy

    var turnprob, maxspeed, accelmod float64
    switch d.species {
    case QUEEN:
        turnprob = QUEEN_TURN_PROB
        maxspeed = QUEEN_MAX_SPEED
        accelmod = QUEEN_ACCEL_MODIFIER
    case BEAST:
        turnprob = BEAST_TURN_PROB
        maxspeed = BEAST_MAX_SPEED
        accelmod = BEAST_ACCEL_MODIFIER
    }

    // Chase target...

    if d.target == nil || rand.Float64() < turnprob || d.target == d {
        tar_id := rand.Intn(QUEENS)
        d.target = d.sim.queens[tar_id]
    }

    vecx, vecy := unit_vector(x, y, d.target.x, d.target.y)

    if vecx == 0 && vecy == 0 {
        speedx += (rand.Float64() * 2 - 1) * accelmod
        speedy += (rand.Float64() * 2 - 1) * accelmod
    } else {
        speedx += vecx * rand.Float64() * accelmod
        speedy += vecy * rand.Float64() * accelmod
    }

    // Wall avoidance...

    if (x < MARGIN) {
        speedx += rand.Float64() * 2
    }
    if (x >= WIDTH - MARGIN) {
        speedx -= rand.Float64() * 2
    }
    if (y < MARGIN) {
        speedy += rand.Float64() * 2
    }
    if (y >= HEIGHT - MARGIN) {
        speedy -= rand.Float64() * 2
    }

    // Player avoidance...

    dx := d.sim.player.x - x
    dy := d.sim.player.y - y

    distance_squared := dx * dx + dy * dy
    distance := math.Sqrt(distance_squared)

    if distance > 1 {
        adjusted_force := AVOID_STRENGTH / (distance_squared * distance)
        speedx -= dx * adjusted_force * rand.Float64()
        speedy -= dy * adjusted_force * rand.Float64()
    }

    // Throttle speed...

    speed := math.Sqrt(speedx * speedx + speedy * speedy)

    if speed > maxspeed {
        speedx *= maxspeed / speed
        speedy *= maxspeed / speed
    }

    // Update entity...

    d.speedx = speedx
    d.speedy = speedy
    d.x += speedx
    d.y += speedy
}

func unit_vector(x1, y1, x2, y2 float64) (float64, float64) {
    dx := x2 - x1
    dy := y2 - y1

    if (dx < 0.01 && dx > -0.01 && dy < 0.01 && dy > -0.01) {
        return 0, 0
    }

    distance := math.Sqrt(dx * dx + dy * dy)
    return dx / distance, dy / distance
}

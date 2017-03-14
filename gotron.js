"use strict";

const APP_FILE = "./electra.exe"

const spawn = require("child_process").spawn;
const alert = require("./modules/alert").alert;         // Useful for debugging

const canvas = document.querySelector("canvas");
const virtue = canvas.getContext("2d");

let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;

canvas.width = WIDTH;
canvas.height = HEIGHT;

let sprites = {};

function start_gotron_client() {

    let that = {};
    let channel_max = 8;

    that.go_frames = 0;
    that.total_draws = 0;
    that.second_last_frame_time = Date.now() - 16;
    that.last_frame_time = Date.now();
    that.all_things = [];

    that.go = spawn(APP_FILE);

    that.go.stdout.on("data", (data) => {
        let lines = data.toString().split("\n");
        for (let n = 0; n < lines.length; n++) {
            handle_line(lines[n]);
        }
    });

    function handle_line(msg) {
        let stuff = msg.split(String.fromCharCode(30));    // Our fields are split by ASCII 30 (record sep)

        let len = stuff.length;
        if (len === 0) {
            return;
        }

        let frame_type = stuff[0];

        if (frame_type === "v") {

            // Deal with visual frames.................................................................

            that.all_things.length = 0;         // Clear our list of drawables.

            that.go_frames += 1;
            that.second_last_frame_time = that.last_frame_time;
            that.last_frame_time = Date.now();

            for (let n = 1; n < len; n += 1) {

                switch (stuff[n].charAt(0)) {

                case "l":
                    that.parse_line(stuff[n]);
                    break;
                case "p":
                case "s":
                    that.parse_point_or_sprite(stuff[n]);
                    break;
                case "t":
                    that.parse_text(stuff[n]);
                    break;
                }
            }

        } else if (frame_type === "a") {

            // Deal with audio events..................................................................

            for (let n = 1; n < len; n += 1) {
                that.play_multi_sound(stuff[n]);
            }

        } else if (frame_type === "d") {

            // Debug messages..........................................................................

            if (len > 0) {
                that.display_debug_message(stuff[1]);
            }

        } else if (frame_type === "r") {

            // Register sprites........................................................................

            if (len > 1) {
                that.register_sprite(stuff[1]);
            }
        }
    }

    // Setup keyboard and mouse...

    document.addEventListener("keydown", function (evt) {
        if (evt.key === " ") {
            that.go.stdin.write("keydown space");
        } else {
            that.go.stdin.write("keydown " + evt.key);
        }
    });

    document.addEventListener("keyup", function (evt) {
        if (evt.key === " ") {
            that.go.stdin.write("keyup space");
        } else {
            that.go.stdin.write("keyup " + evt.key);
        }
    });

    canvas.addEventListener("mousedown", function (evt) {
        let x;
        let y;
        x = evt.clientX - canvas.offsetLeft;
        y = evt.clientY - canvas.offsetTop;
        that.go.stdin.write("click " + x.toString() + " " + y.toString());
    });

    that.register_sprite = function (blob) {

        let elements = blob.split(String.fromCharCode(31));

        let filename = elements[0];
        let varname = elements[1];

        sprites[varname] = new Image();
        sprites[varname].src = filename;
    }

    that.parse_point_or_sprite = function (blob) {

        let elements = blob.split(String.fromCharCode(31));

        let thing = {};

        thing.type = elements[0];

        if (thing.type === "p") {
            thing.colour = elements[1];
        } else if (thing.type === "s") {
            thing.varname = elements[1];
        }

        thing.x = parseFloat(elements[2]);
        thing.y = parseFloat(elements[3]);
        thing.speedx = parseFloat(elements[4]);
        thing.speedy = parseFloat(elements[5]);

        that.all_things.push(thing);
    };

    that.parse_line = function (blob) {

        let elements = blob.split(String.fromCharCode(31));

        let thing = {};

        thing.type = elements[0];
        thing.colour = elements[1];
        thing.x1 = parseFloat(elements[2]);
        thing.y1 = parseFloat(elements[3]);
        thing.x2 = parseFloat(elements[4]);
        thing.y2 = parseFloat(elements[5]);
        thing.speedx = parseFloat(elements[6]);
        thing.speedy = parseFloat(elements[7]);

        that.all_things.push(thing);
    };

    that.parse_text = function (blob) {

        let elements = blob.split(String.fromCharCode(31));

        if (elements.length < 9) {
            return;
        }

        let thing = {};

        thing.type = elements[0];
        thing.colour = elements[1];
        thing.size =  parseFloat(elements[2]);
        thing.font = elements[3];
        thing.x = parseFloat(elements[4]);
        thing.y = parseFloat(elements[5]);
        thing.speedx = parseFloat(elements[6]);
        thing.speedy = parseFloat(elements[7]);
        thing.text = elements[8];

        that.all_things.push(thing);
    };

    that.draw_text = function(t, time_offset) {
        let x = Math.floor(t.x + t.speedx * time_offset / 1000);
        let y = Math.floor(t.y + t.size / 2 + t.speedy * time_offset / 1000);

        virtue.fillStyle = t.colour;
        virtue.textAlign = "center";
        virtue.font = t.size.toString() + "px " + t.font;
        virtue.fillText(t.text, x, y);
    };

    that.draw_point = function (p, time_offset) {
        let x = Math.floor(p.x + p.speedx * time_offset / 1000);
        let y = Math.floor(p.y + p.speedy * time_offset / 1000);
        virtue.fillStyle = p.colour;
        virtue.fillRect(x, y, 1, 1);
    };

    that.draw_sprite = function (sp, time_offset) {
        let x = sp.x + sp.speedx * time_offset / 1000;
        let y = sp.y + sp.speedy * time_offset / 1000;

        if (sprites[sp.varname] === undefined) {
            alert("Got bad sprite: " + sp.varname);
        }

        virtue.drawImage(sprites[sp.varname], x - sprites[sp.varname].width / 2, y - sprites[sp.varname].height / 2);
    };

    that.draw_line = function (li, time_offset) {
        let x1 = li.x1 + li.speedx * time_offset / 1000;
        let y1 = li.y1 + li.speedy * time_offset / 1000;
        let x2 = li.x2 + li.speedx * time_offset / 1000;
        let y2 = li.y2 + li.speedy * time_offset / 1000;

        virtue.strokeStyle = li.colour;
        virtue.beginPath();
        virtue.moveTo(x1, y1);
        virtue.lineTo(x2, y2);
        virtue.stroke();
    };

    that.draw = function () {

        virtue.clearRect(0, 0, WIDTH, HEIGHT);     // The best way to clear the canvas??

        // As a relatively simple way of dealing with arbitrary timings of incoming data, we
        // always try to draw the object "where it is now" taking into account how long it's
        // been since we received info about it. This is done with this "time_offset" let.

        let time_offset = Date.now() - that.last_frame_time;

        // Cache letious things for speed reasons...

        let all_things = that.all_things;
        let len = all_things.length;

        let draw_point = that.draw_point;
        let draw_sprite = that.draw_sprite;
        let draw_line = that.draw_line;
        let draw_text = that.draw_text;

        for (let n = 0; n < len; n += 1) {

            switch (all_things[n].type) {
            case "l":
                draw_line(all_things[n], time_offset);
                break;
            case "p":
                draw_point(all_things[n], time_offset);
                break;
            case "s":
                draw_sprite(all_things[n], time_offset);
                break;
            case "t":
                draw_text(all_things[n], time_offset);
                break;
            }
        }
    };

    that.animate = function () {

        if (that.go_frames > 0) {
            that.total_draws += 1;
        }

        that.draw();
        requestAnimationFrame(that.animate);
    };

    that.display_debug_message = function (s) {
        document.title = s;
    };

    // Sound from Thomas Sturm: http://www.storiesinflight.com/html5/audio.html

    that.init_sound = function () {
        that.audiochannels = [];
        while (that.audiochannels.length < channel_max) {
            that.audiochannels.push({channel: new Audio(), finished: -1});
        }
    };

    that.play_multi_sound = function (s) {
        let a;
        let thistime;

        for (a = 0; a < that.audiochannels.length; a += 1) {
            thistime = new Date();
            if (that.audiochannels[a].finished < thistime.getTime()) {
                that.audiochannels[a].finished = thistime.getTime() + document.getElementById(s).duration * 1000;
                that.audiochannels[a].channel.src = document.getElementById(s).src;
                that.audiochannels[a].channel.load();
                that.audiochannels[a].channel.play();
                break;
            }
        }
    };

    that.init_sound();
    requestAnimationFrame(that.animate);
}

start_gotron_client();

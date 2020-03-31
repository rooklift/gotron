"use strict";

/*

   Summary of the comms protocol:
   Each message has a 1 char type indicator, followed by the blobs of the message.
   The type indicator and the blobs are separated from each other by 0x1e (30).
   The fields inside a blob are separated by 0x1f (31).

   v (30) p (31) #ffffff (31) 25.2 (31) 54.7 (31) 2.2 (31) 1.3 (30) p (31) #ff0000 (31) 127.4 (31) 339.7 (31) -1.0 (31) 0.4
   |   |                                                         |
   |   |  ---------------------- blob ------------------------   |  ------------------------- blob ------------------------
   |   |                                                         |
   | recsep                                                    recsep
   |
  type

*/

function make_gotron_client() {

	const child_process = require("child_process");
	const fs = require("fs");
	const readline = require("readline");
	const alert = require("./modules/alert");         // Useful for debugging

	const REC_SEP = "\x1e";
	const UNIT_SEP = "\x1f";

	const config = JSON.parse(fs.readFileSync("gotron.cfg", "utf8"));
	const channel_max = 8;
	const canvas = document.querySelector("canvas");
	const virtue = canvas.getContext("2d");

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	let that = {};
	that.iteration = 0;

	that.sprites = {};
	that.sounds = {};

	that.all_things = [];

	that.second_last_frame_time = Date.now() - 16;
	that.last_frame_time = Date.now();

	that.go = child_process.spawn(config.executable);

	let scanner = readline.createInterface({
		input: that.go.stdout,
		output: undefined,
		terminal: false
	});

	scanner.on("line", (line) => {

		let stuff = line.split(REC_SEP);

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

			for (let n = 1; n < len; n++) {

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

			for (let n = 1; n < len; n++) {
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

		} else if (frame_type === "s") {

			// Register sounds.........................................................................

			if (len > 1) {
				that.register_sound(stuff[1]);
			}
		}
	});

	// Setup keyboard and mouse...

	document.addEventListener("keydown", (evt) => {
		if (evt.key === " ") {
			that.go.stdin.write("keydown space\n");
		} else {
			that.go.stdin.write("keydown " + evt.key + "\n");
		}
	});

	document.addEventListener("keyup", (evt) => {
		if (evt.key === " ") {
			that.go.stdin.write("keyup space\n");
		} else {
			that.go.stdin.write("keyup " + evt.key + "\n");
		}
	});

	canvas.addEventListener("mousedown", (evt) => {
		let x = evt.clientX - canvas.offsetLeft;
		let y = evt.clientY - canvas.offsetTop;
		that.go.stdin.write("click " + evt.button.toString() + " " + x.toString() + " " + y.toString() + "\n");
	});

	// Parsers for individual blobs in a message...

	that.register_sprite = function (blob) {

		let elements = blob.split(UNIT_SEP);

		let filename = elements[0];
		let varname = elements[1];

		that.sprites[varname] = new Image();
		that.sprites[varname].src = filename;
	}

	that.register_sound = function (blob) {

		let elements = blob.split(UNIT_SEP);

		let filename = elements[0];
		let varname = elements[1];

		that.sounds[varname] = new Audio();
		that.sounds[varname].src = filename;
	}

	that.parse_point_or_sprite = function (blob) {

		let elements = blob.split(UNIT_SEP);

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

		let elements = blob.split(UNIT_SEP);

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

		let elements = blob.split(UNIT_SEP);

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

		if (that.sprites[sp.varname] === undefined) {
			alert("Got bad sprite: " + sp.varname);
		}

		virtue.drawImage(that.sprites[sp.varname], x - that.sprites[sp.varname].width / 2, y - that.sprites[sp.varname].height / 2);
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

		virtue.clearRect(0, 0, canvas.width, canvas.height);     // The best way to clear the canvas??

		// As a relatively simple way of dealing with arbitrary timings of incoming data, we
		// always try to draw the object "where it is now" taking into account how long it's
		// been since we received info about it. This is done with this "time_offset" let.

		let time_offset = Date.now() - that.last_frame_time;

		// Cache various things for "speed" reasons (probably pointless).

		let all_things = that.all_things;
		let len = all_things.length;

		let draw_point = that.draw_point;
		let draw_sprite = that.draw_sprite;
		let draw_line = that.draw_line;
		let draw_text = that.draw_text;

		for (let n = 0; n < len; n++) {

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

	that.main = function () {
		that.iteration++;
		if (that.iteration % 60 === 0) {
			let new_width = window.innerWidth;
			let new_height = window.innerHeight;
			if (new_width !== canvas.width || new_height !== canvas.height) {
				canvas.width = new_width;
				canvas.height = new_height;
				that.send_resize();
			}
		}
		that.draw();
		requestAnimationFrame(that.main);
	};

	that.display_debug_message = function (s) {
		document.title = s;
	};

	that.send_resize = function () {
		that.go.stdin.write("resize " + canvas.width.toString() + " " + canvas.height.toString() +"\n");
	};

	// Sound from Thomas Sturm: http://www.storiesinflight.com/html5/audio.html

	that.init_sound = function () {
		that.audiochannels = [];
		while (that.audiochannels.length < channel_max) {
			that.audiochannels.push({channel: new Audio(), finished: -1});
		}
	};

	that.play_multi_sound = function (s) {
		let thistime = Date.now()
		for (let a = 0; a < that.audiochannels.length; a++) {
			if (that.audiochannels[a].finished < thistime) {
				that.audiochannels[a].finished = thistime + that.sounds[s].duration * 1000;
				that.audiochannels[a].channel.src = that.sounds[s].src;
				that.audiochannels[a].channel.load();
				that.audiochannels[a].channel.play();
				break;
			}
		}
	};

	that.start = function() {
		that.send_resize();
		that.init_sound();
		requestAnimationFrame(that.main);
	}

	return that;
}

let client = make_gotron_client();
client.start()

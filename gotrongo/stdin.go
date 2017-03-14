package wsworld

import (
    "bufio"
    "os"
    "strconv"
    "strings"
)

func stdin_reader() {

    // Handle incoming messages...

    reader := bufio.NewReader(os.Stdin)

    for {

        bytes, _ := reader.ReadString('\n')        // FIXME: this may be vulnerable to malicious huge messages

        fields := strings.Fields(string(bytes))

        switch fields[0] {

        case "keyup":

            if len(fields) > 1 {
                eng.mutex.Lock()
                eng.keyboard[fields[1]] = false
                eng.mutex.Unlock()
            }

        case "keydown":

            if len(fields) > 1 {
                eng.mutex.Lock()
                eng.keyboard[fields[1]] = true
                eng.mutex.Unlock()
            }

        case "click":

            if len(fields) > 2 {

                x, _ := strconv.Atoi(fields[1])
                y, _ := strconv.Atoi(fields[2])

                eng.mutex.Lock()
                eng.clicks = append(eng.clicks, []int{x, y})
                eng.mutex.Unlock()
            }
        }
    }
}

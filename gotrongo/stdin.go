package wsworld

import (
    "bufio"
    "os"
    "strconv"
    "strings"
)

func stdin_reader() {

    scanner := bufio.NewScanner(os.Stdin)

    // logfile, _ := os.Create("stdin.txt")

    for {

        scanner.Scan()
        fields := strings.Fields(scanner.Text())

        // logfile.WriteString(scanner.Text())
        // logfile.WriteString("\n")

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

        case "resize":

            if len(fields) > 2 {

                eng.mutex.Lock()
                eng.width, _ = strconv.Atoi(fields[1])
                eng.height, _ = strconv.Atoi(fields[2])
                eng.mutex.Unlock()
            }
        }
    }
}

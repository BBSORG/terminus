import { BaseSession } from 'terminus-terminal'

export interface LoginScript {
    expect?: string
    send: string
}

export interface SSHConnection {
    name?: string
    host: string
    port: number
    user: string
    password?: string
    privateKey?: string
    group?: string
    scripts?: LoginScript[]
}

export class SSHSession extends BaseSession {
    scripts?: LoginScript[]

    constructor (private shell: any, conn: SSHConnection) {
        super()
        this.scripts = conn.scripts || []
    }

    start () {
        this.open = true

        this.shell.on('data', data => {
            let dataString = data.toString()
            this.emitOutput(dataString)

            if (this.scripts) {
                let found = false
                for (let script of this.scripts) {
                    if (dataString.includes(script.expect)) {
                        console.log('Executing script:', script.send)
                        this.shell.write(script.send + '\n')
                        this.scripts = this.scripts.filter(x => x !== script)
                        found = true
                    } else {
                        break
                    }
                }

                if (found) {
                    this.executeUnconditionalScripts()
                }
            }
        })

        this.shell.on('end', () => {
            if (this.open) {
                this.destroy()
            }
        })

        this.executeUnconditionalScripts()
    }

    resize (columns, rows) {
        this.shell.setWindow(rows, columns)
    }

    write (data) {
        this.shell.write(data)
    }

    kill (signal?: string) {
        this.shell.signal(signal || 'TERM')
    }

    async getChildProcesses (): Promise<any[]> {
        return []
    }

    async gracefullyKillProcess (): Promise<void> {
        this.kill('TERM')
    }

    async getWorkingDirectory (): Promise<string> {
        return null
    }

    private executeUnconditionalScripts () {
        if (this.scripts) {
            for (let script of this.scripts) {
                if (!script.expect) {
                    console.log('Executing script:', script.send)
                    this.shell.write(script.send + '\n')
                    this.scripts = this.scripts.filter(x => x !== script)
                } else {
                    break
                }
            }
        }
    }
}

export interface ISSHConnectionGroup {
    name: string
    connections: SSHConnection[]
}

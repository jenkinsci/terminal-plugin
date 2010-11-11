(function() {

function CommandHistory() {
    this.histories = []
    this.index = 0
}

CommandHistory.prototype = {
    _get: function() {
        if (this.index >= 0 && this.histories.length <= this.index) {
            return this.histories[this.index]
        }
    },
    add: function(cmd) {
        if (this.histories && this.histories[0] != cmd) {
            this.histories.unshift(cmd)
        }
    },
    next: function() {
        var result;
        if (this.index >= 0 && this.histories) {
            result = this.histories[this.index]
            if (this.index) {
                this.index--
            }
        }
        return result;
    },
    prev: function() {
        var result;
        if (this.index >= 0 && this.histories) {
            result = this.histories[this.index]
            if (this.histories.length - 1 > this.index) {
                this.index++
            }
        }
        return result;
    },
    reset: function() {
        this.index = 0
    },
    clear: function() {
        this.histories = []
        this.index = 0
    }
}

function Terminal() {
    var titleBar = j$('<div class="titleBar">Hudson Terminal</div>')
    this.console = j$('<div/>').attr('class', 'console')
    this.panel = j$('<div style="display:none" class="hudsonterminal"/>')
        .append(titleBar).append(this.console).appendTo(document.body)
        .draggable({
            'handle' : titleBar,
            'cursor' : 'move'
        })
    this.node = 'master'
    this.newLine();
    this.history = new CommandHistory()
}

Terminal.prototype = {
    clear: function(cmd) {
        this.console.children().remove();
        this.newLine(cmd || '')
    },
    log: function(text) {
        this.console.append(j$('<pre></pre>').text('[HUDSON TERMINAL] ' + text))
    },
    newLine : function(val) {
        var self = this;
        var input = j$('<input type="text"/>').val(val || '').keydown(function(e) {
            if (/* enter */e.keyCode == 13) {
                input.after(j$('<span/>').text(input.val()))
                input.remove();
                self.exec(input.val())
            } else if (/* up */e.keyCode == 38) {
                input.val(self.history.prev())
            } else if (/* down */e.keyCode == 40) {
                input.val(self.history.next())
            } else if (/* ctrl + l */e.ctrlKey && e.keyCode == 76) {
                self.clear(input.val())
            }
        });
        self.console.append(j$('<div/>')
            .append('<span style="padding-right:5px">'+self.node+'&gt;</span>')
            .append(input)
        )
        input.focus();
    },
    exec : function(command) {
        var self = this;
        command = (command || '').replace(/^[ ]+|[ ]+$/g, '')
        if (!command) {
            self.newLine()
            return
        }
        if (command == 'exit') {
            self.clear()
            self.history.clear()
            self.panel.toggle()
            return
        }
        self.history.add(command)
        var m = command.match(/hudson\s+(.*)/)
        if (m) {
            self.execHudsonCmd(m[1])
            return
        }
        j$.ajax({
            'url' : rootURL + self.node=='master'?'/script':'/computer/'+self.node+'/script',
            'data' : 'script=' + encodeURIComponent('println(("""' + command.split(/[^\\]\|/).join('""".execute() | """') + '""".execute()).text)'),
            'beforeSend': function(xhr) {
                xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
            },
            'success': function(html) {
                self.console.append(j$('pre', j$(html))[1])
                self.newLine()
            },
            'error': function(xhr, status, err) {
                self.log('ERROR: ' + xhr.status)
                self.newLine()
            },
            timeout: 5000
        })
    },
    execHudsonCmd: function(command) {
        var self = this
        var args = command.split(/\s/)
        var cmd = args.shift();
        (this._hudsonCommands[cmd] || function(terminal, args) {
            terminal.log('No such command:' + command)
        })(self, args);
        self.newLine()
    },
    _hudsonCommands: {
        'lsnode': function(terminal) {
            terminal.console.append(j$('<pre></pre>').text(TerminalContext.nodeNames.join('\n')))
        },
        'chnode': function(terminal, args) {
            args[0] = args[0] || 'master'
            if (args[0] != 'master' && j$.inArray(args[0], TerminalContext.nodeNames) < 0) {
                terminal.log('No such node: ' + args[0])
            } else {
                terminal.node = args[0]
            }
        }
    }
}

j$(function() {
    var terminal = new Terminal()
    j$.each(j$('a[href="/#terminal"]'), function(index, link) {
        j$(link).click(function() {
            terminal.panel.toggle()
            j$('input', terminal.panel).focus()
            return false
        })
    })
})

})()
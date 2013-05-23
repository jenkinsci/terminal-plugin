(function($) {

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
    var titleBar = $('<div class="titleBar">Jenkins Terminal</div>')
    this.console = $('<div/>').attr('class', 'console')
    this.panel = $('<div style="display:none" class="jenkinsterminal"/>')
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
        this.console.append($('<pre></pre>').text('[JENKINS TERMINAL] ' + text))
    },
    newLine : function(val) {
        var self = this;
        var input = $('<input type="text"/>').val(val || '').keydown(function(e) {
            if (/* enter */e.keyCode == 13) {
                input.after($('<span/>').text(input.val()))
                input.remove();
                self.exec(input.val())
            } else if (/* up */e.keyCode == 38) {
                input.val(self.history.prev())
            } else if (/* down */e.keyCode == 40) {
                input.val(self.history.next())
            } else if (/* ctrl + l */e.ctrlKey && e.keyCode == 76) {
                self.clear(input.val())
                return false
            }
        });
        self.console.append($('<div/>')
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
        var m = command.match(/jenkins\s+(.*)/)
        if (m) {
            self.execJenkinsCmd(m[1])
            return
        }
        $.ajax({
            'url' : rootURL + (self.node=='master'?'/script':'/computer/'+self.node+'/script'),
            'data' : 'script=' + encodeURIComponent('println(("""' + command.split(/[^\\]\|/).join('""".execute() | """') + '""".execute()).text)'),
            'type' : 'POST',
            'beforeSend': function(xhr) {
                xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
            },
            'success': function(html) {
                self.console.append($('pre', $(html))[1])
                self.newLine()
            },
            'error': function(xhr, status, err) {
                if (status == 'timeout') {
                    self.log('ERROR: Time out')
                } else {
                    self.log('ERROR: ' + xhr.status)
                }
                self.newLine()
            },
            timeout: 5000
        })
    },
    execJenkinsCmd: function(command) {
        var self = this
        var args = command.split(/\s/)
        var cmd = args.shift();
        (this._jenkinsCommands[cmd] || function(terminal, args) {
            terminal.log('No such command:' + command)
        })(self, args);
        self.newLine()
    },
    _jenkinsCommands: {
        'lsnode': function(terminal) {
            terminal.console.append($('<pre></pre>').text(TerminalContext.nodeNames.join('\n')))
        },
        'chnode': function(terminal, args) {
            args[0] = args[0] || 'master'
            if (args[0] != 'master' && $.inArray(args[0], TerminalContext.nodeNames) < 0) {
                terminal.log('No such node: ' + args[0])
            } else {
                terminal.node = args[0]
            }
        }
    }
}

$(function() {
    var terminal = new Terminal()
    $.each($('a[href="' + rootURL + '/#terminal"]'), function(index, link) {
        $(link).click(function() {
            terminal.panel.toggle()
            $('input', terminal.panel).focus()
            return false
        })
    })
})

})(jQuery)
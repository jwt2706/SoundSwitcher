const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const GLib = imports.gi.GLib;

function runCommand(command) {
    try {
        let [res, out, err, status] = GLib.spawn_command_line_sync(command);
        return out ? out.toString().trim() : "";
    } catch (e) {
        global.logError(e);
        return "";
    }
}

class AudioSwitcherApplet extends Applet.TextIconApplet {
    constructor(metadata, orientation, panelHeight, instanceId) {
        super(orientation, panelHeight, instanceId);

        this.set_applet_icon_name("audio-card");
        this.set_applet_label("Audio");
        this.set_applet_tooltip("Switch audio output device");

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);
    }

    on_applet_clicked(event) {
        this.refreshMenu();
        this.menu.toggle();
    }

    refreshMenu() {
        this.menu.removeAll();

        const sinkList = runCommand("pactl list short sinks");
        const sinks = sinkList.split("\n");

        sinks.forEach(line => {
            if (!line) return;
            const parts = line.split("\t");
            const sinkName = parts[1];
            const displayName = parts[1]; // You can prettify if needed

            const item = new PopupMenu.PopupMenuItem(displayName);
            item.connect("activate", () => {
                this.setDefaultSink(sinkName);
            });

            this.menu.addMenuItem(item);
        });
    }

    setDefaultSink(sinkName) {
        // Set default sink
        runCommand(`pactl set-default-sink ${sinkName}`);

        // Move all current audio streams to new sink
        const inputs = runCommand("pactl list short sink-inputs").split("\n");
        inputs.forEach(line => {
            if (!line) return;
            const inputId = line.split("\t")[0];
            runCommand(`pactl move-sink-input ${inputId} ${sinkName}`);
        });

        this.set_applet_tooltip(`Current output: ${sinkName}`);
    }
}

function main(metadata, orientation, panelHeight, instanceId) {
    return new AudioSwitcherApplet(metadata, orientation, panelHeight, instanceId);
}

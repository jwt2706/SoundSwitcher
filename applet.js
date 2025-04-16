const Applet = imports.ui.applet;
const GLib = imports.gi.GLib;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;

function runCommand(command) {
    try {
        return GLib.spawn_command_line_sync(command)[1].toString();
    } catch (e) {
        return "";
    }
}

class AudioSwitcherApplet extends Applet.TextIconApplet {
    constructor(metadata, orientation, panelHeight, instanceId) {
        super(orientation, panelHeight, instanceId);
        this.setIconSymbolicName("audio-card");
        this.setTooltipText("Switch Audio Output");

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this.refreshMenu();
    }

    refreshMenu() {
        this.menu.removeAll();
        let output = runCommand("pactl list short sinks").trim();
        let lines = output.split("\n");

        for (let line of lines) {
            let parts = line.split("\t");
            let sinkName = parts[1];
            let item = new PopupMenu.PopupMenuItem(sinkName);
            item.connect("activate", () => {
                runCommand(`pactl set-default-sink ${sinkName}`);
                let inputs = runCommand("pactl list short sink-inputs").trim().split("\n");
                for (let inputLine of inputs) {
                    let inputId = inputLine.split("\t")[0];
                    runCommand(`pactl move-sink-input ${inputId} ${sinkName}`);
                }
            });
            this.menu.addMenuItem(item);
        }
    }

    on_applet_clicked(event) {
        this.refreshMenu();
        this.menu.toggle();
    }
}

function main(metadata, orientation, panelHeight, instanceId) {
    return new AudioSwitcherApplet(metadata, orientation, panelHeight, instanceId);
}

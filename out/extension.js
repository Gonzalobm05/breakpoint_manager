"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    const provider = new BreakpointGroupProvider(context);
    const treeView = vscode.window.createTreeView("breakpointGroups", {
        treeDataProvider: provider,
        dragAndDropController: provider,
    });
    context.subscriptions.push(treeView, vscode.window.registerTreeDataProvider("breakpointGroups", provider), vscode.commands.registerCommand("breakpointGroups.addGroup", () => provider.addGroup()), vscode.commands.registerCommand("breakpointGroups.toggleGroup", (item) => provider.toggleGroup(item)), vscode.commands.registerCommand("breakpointGroups.renameGroup", (item) => provider.renameGroup(item)), vscode.commands.registerCommand("breakpointGroups.deleteGroup", (item) => provider.deleteGroup(item)), vscode.commands.registerCommand("breakpointGroups.addBreakpoint", (item) => provider.addBreakpointToGroup(item)), vscode.commands.registerCommand("breakpointGroups.deleteBreakpoint", (item) => provider.deleteBreakpoint(item)), vscode.commands.registerCommand("breakpointGroups.moveBreakpoint", (item) => provider.moveBreakpoint(item)), vscode.commands.registerCommand("breakpointGroups.selectGroup", (item) => provider.selectGroup(item)));
    vscode.debug.onDidChangeBreakpoints((event) => {
        provider.handleNewBreakpoints(event);
    });
    let lastSelectedItem = null;
    // Detect selection changes
    treeView.onDidChangeSelection((event) => {
        if (event.selection.length > 0) {
            if (event.selection[0].contextValue === "group") {
                lastSelectedItem = event.selection[0];
                provider.selectGroup(event.selection[0]);
            }
        }
        else {
            lastSelectedItem = null;
            provider.unselectGroup();
        }
    });
    // Detect clicks inside the view but outside of an item
    treeView.onDidChangeVisibility((event) => {
        if (event.visible && !lastSelectedItem) {
            provider.unselectGroup();
        }
    });
}
class BreakpointGroupProvider {
    groups = {};
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    suppressHandleNewBreakpoints = false;
    context;
    selectedGroup = null;
    groupToggleState = {};
    dropMimeTypes = ["application/vnd.code.tree.breakpointGroups"];
    dragMimeTypes = ["application/vnd.code.tree.breakpointGroups"];
    constructor(context) {
        this.context = context;
        this.loadGroups();
        this.groupToggleState = this.context.globalState.get("groupToggleState", {});
        // Ensure "Ungrouped" always exists
        if (!this.groups["Ungrouped"]) {
            this.groups["Ungrouped"] = [];
        }
    }
    async handleDrop(target, draggedItems, token) {
        const groupName = target.label?.toString() ?? "";
        if (!this.groups[groupName])
            return; // Ensure valid target group
        const draggedItem = draggedItems.get("application/vnd.code.tree.breakpointGroups");
        if (!draggedItem)
            return;
        const movedBreakpointLabel = draggedItem.value;
        let movedBreakpoint;
        // Find and remove the breakpoint from its current group
        for (const group in this.groups) {
            this.groups[group] = this.groups[group].filter((bp) => {
                if (bp instanceof vscode.SourceBreakpoint &&
                    this.getBreakpointLabel(bp) === movedBreakpointLabel) {
                    movedBreakpoint = bp;
                    return false; // Remove from original group
                }
                return true;
            });
        }
        // Add the breakpoint to the new group
        if (movedBreakpoint) {
            this.groups[groupName].push(movedBreakpoint);
            this.saveGroups();
            this._onDidChangeTreeData.fire();
        }
    }
    async handleDrag(source, dataTransfer, token) {
        if (source.length === 0 || source[0].contextValue !== "breakpoint")
            return;
        const draggedItemLabel = typeof source[0].label === "string"
            ? source[0].label
            : source[0].label?.label ?? "";
        dataTransfer.set("application/vnd.code.tree.breakpointGroups", new vscode.DataTransferItem(draggedItemLabel));
        vscode.window.showInformationMessage(`Dragging breakpoint: ${draggedItemLabel}`);
    }
    getTreeItem(element) {
        if (element.contextValue === "group") {
            element.command = {
                command: "breakpointGroups.selectGroup",
                title: "Select Breakpoint Group",
                arguments: [element],
            };
        }
        // Enable dragging for breakpoints
        if (element.contextValue === "breakpoint") {
            element.resourceUri = vscode.Uri.parse(`breakpoint://${element.label}`);
            element.contextValue = "breakpoint";
        }
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Ensure "Ungrouped" always exists
            if (!this.groups["Ungrouped"]) {
                this.groups["Ungrouped"] = [];
            }
            // Sort groups alphabetically, but keep "Ungrouped" last
            const sortedGroups = Object.keys(this.groups)
                .filter((group) => group !== "Ungrouped") // Exclude "Ungrouped" initially
                .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
            sortedGroups.push("Ungrouped"); // Add "Ungrouped" at the end
            return sortedGroups.map((groupName) => {
                const groupItem = new vscode.TreeItem(groupName, vscode.TreeItemCollapsibleState.Collapsed);
                groupItem.contextValue = "group";
                groupItem.iconPath = new vscode.ThemeIcon(this.groupToggleState[groupName] ? "circle-large-filled" : "circle-large-outline");
                return groupItem;
            });
        }
        else {
            const groupName = element.label?.toString() ?? "";
            return (this.groups[groupName] ?? [])
                .sort((a, b) => this.getBreakpointLabel(a).localeCompare(this.getBreakpointLabel(b)))
                .map((bp) => {
                if (bp instanceof vscode.SourceBreakpoint) {
                    const bpItem = new vscode.TreeItem(this.getBreakpointLabel(bp), vscode.TreeItemCollapsibleState.None);
                    bpItem.contextValue = "breakpoint";
                    bpItem.iconPath = new vscode.ThemeIcon("debug-breakpoint");
                    return bpItem;
                }
                return new vscode.TreeItem("Invalid Breakpoint", vscode.TreeItemCollapsibleState.None);
            });
        }
    }
    handleNewBreakpoints(event) {
        if (this.suppressHandleNewBreakpoints) {
            return; // Ignore breakpoints added by the extension
        }
        event.added.forEach((bp) => {
            if (bp instanceof vscode.SourceBreakpoint) {
                const groupName = this.selectedGroup ?? "Ungrouped";
                if (!this.groups[groupName]) {
                    this.groups[groupName] = [];
                }
                // Prevent duplicate breakpoints in the group
                if (!this.groups[groupName].some((existingBp) => existingBp instanceof vscode.SourceBreakpoint &&
                    this.getBreakpointLabel(existingBp) ===
                        this.getBreakpointLabel(bp))) {
                    this.groups[groupName].push(bp);
                    this.saveGroups();
                }
            }
        });
        this._onDidChangeTreeData.fire();
    }
    selectGroup(item) {
        if (item.contextValue !== "group")
            return;
        this.selectedGroup =
            typeof item.label === "string" ? item.label : item.label?.label ?? "";
        this.context.globalState.update("selectedGroup", this.selectedGroup);
        vscode.window.showInformationMessage(`Selected Group: ${this.selectedGroup}`);
    }
    unselectGroup() {
        this.selectedGroup = "Ungrouped";
        vscode.window.showInformationMessage("No group selected. Breakpoints will be added to 'Ungrouped'.");
    }
    getBreakpointLabel(bp) {
        if (bp.location instanceof vscode.Location) {
            const filePath = bp.location.uri.fsPath.split(/[\\/]/).pop(); // Extract only file name
            const line = bp.location.range.start.line + 1; // Convert 0-based index to human-readable
            return `${filePath}:${line}`;
        }
        return "Unknown Breakpoint";
    }
    addGroup() {
        vscode.window
            .showInputBox({ prompt: "Enter Group Name" })
            .then((groupName) => {
            if (groupName && !this.groups[groupName]) {
                this.groups[groupName] = [];
                this.saveGroups();
                this._onDidChangeTreeData.fire();
            }
        });
    }
    renameGroup(item) {
        const oldGroupName = typeof item.label === "string" ? item.label : item.label?.label ?? "";
        if (!this.groups[oldGroupName])
            return;
        vscode.window
            .showInputBox({ prompt: "Enter new group name", value: oldGroupName })
            .then((newGroupName) => {
            if (!newGroupName || newGroupName === oldGroupName)
                return;
            // Rename the group
            this.groups[newGroupName] = this.groups[oldGroupName];
            delete this.groups[oldGroupName];
            // Rename the toggle state if it exists
            if (this.groupToggleState[oldGroupName] !== undefined) {
                this.groupToggleState[newGroupName] =
                    this.groupToggleState[oldGroupName];
                delete this.groupToggleState[oldGroupName];
                this.context.globalState.update("groupToggleState", this.groupToggleState);
            }
            this.saveGroups();
            this._onDidChangeTreeData.fire();
            vscode.window.showInformationMessage(`Renamed group "${oldGroupName}" to "${newGroupName}".`);
        });
    }
    deleteGroup(item) {
        const groupName = typeof item.label === "string" ? item.label : item.label?.label ?? "";
        if (!this.groups[groupName])
            return;
        // Move all breakpoints in the deleted group to "Ungrouped"
        if (!this.groups["Ungrouped"]) {
            this.groups["Ungrouped"] = [];
        }
        this.groups["Ungrouped"].push(...this.groups[groupName]);
        // Delete the group and its toggle state
        delete this.groups[groupName];
        delete this.groupToggleState[groupName];
        this.context.globalState.update("groupToggleState", this.groupToggleState);
        this.saveGroups();
        this._onDidChangeTreeData.fire();
        vscode.window.showInformationMessage(`Deleted group "${groupName}". Breakpoints moved to "Ungrouped".`);
    }
    addBreakpointToGroup(item) {
        const breakpoints = vscode.debug.breakpoints.filter((bp) => bp instanceof vscode.SourceBreakpoint);
        if (breakpoints.length === 0) {
            vscode.window.showInformationMessage("No breakpoints set.");
            return;
        }
        vscode.window
            .showQuickPick(breakpoints.map((bp) => this.getBreakpointLabel(bp)), { placeHolder: "Select Breakpoint to Add" })
            .then((selected) => {
            if (selected) {
                const selectedBreakpoint = breakpoints.find((bp) => this.getBreakpointLabel(bp) === selected);
                if (selectedBreakpoint) {
                    // Determine the target group
                    const groupName = item?.label?.toString() ?? this.selectedGroup ?? "Ungrouped";
                    // Ensure the group exists
                    if (!this.groups[groupName]) {
                        this.groups[groupName] = [];
                    }
                    // Add the breakpoint to the group
                    this.groups[groupName].push(selectedBreakpoint);
                    this.saveGroups();
                    this._onDidChangeTreeData.fire();
                }
            }
        });
    }
    deleteBreakpoint(item) {
        for (const group in this.groups) {
            this.groups[group] = this.groups[group].filter((bp) => {
                if (bp instanceof vscode.SourceBreakpoint) {
                    return this.getBreakpointLabel(bp) !== item.label; // Compare correct types
                }
                return true; // Ignore invalid objects
            });
        }
        this.saveGroups();
        this._onDidChangeTreeData.fire();
    }
    moveBreakpoint(item) {
        vscode.window
            .showQuickPick(Object.keys(this.groups), {
            placeHolder: "Select target group",
        })
            .then((targetGroup) => {
            if (targetGroup) {
                let movedBreakpoint;
                // Find and remove the breakpoint from the current group
                for (const group in this.groups) {
                    this.groups[group] = this.groups[group].filter((bp) => {
                        if (bp instanceof vscode.SourceBreakpoint &&
                            this.getBreakpointLabel(bp) === item.label) {
                            movedBreakpoint = bp;
                            return false; // Remove from original group
                        }
                        return true;
                    });
                }
                // Add the breakpoint to the new group
                if (movedBreakpoint) {
                    this.groups[targetGroup].push(movedBreakpoint);
                }
                this.saveGroups();
                this._onDidChangeTreeData.fire();
            }
        });
    }
    toggleGroup(item) {
        const groupName = typeof item.label === "string" ? item.label : item.label?.label ?? "";
        if (!this.groups[groupName])
            return;
        const isEnabled = this.groupToggleState[groupName] ?? true;
        this.groupToggleState[groupName] = !isEnabled;
        this.context.globalState.update("groupToggleState", this.groupToggleState);
        // Ensure we only pass valid breakpoints
        const oldBreakpoints = this.groups[groupName].filter((bp) => bp instanceof vscode.SourceBreakpoint);
        this.suppressHandleNewBreakpoints = true; // Prevent handleNewBreakpoints() from running
        vscode.debug.removeBreakpoints(oldBreakpoints);
        const updatedBreakpoints = oldBreakpoints.map((bp) => new vscode.SourceBreakpoint(bp.location, this.groupToggleState[groupName]));
        vscode.debug.addBreakpoints(updatedBreakpoints);
        this.suppressHandleNewBreakpoints = false; // Re-enable handleNewBreakpoints()
        this.groups[groupName] = updatedBreakpoints;
        this.saveGroups();
        vscode.window.showInformationMessage(`Breakpoints in "${groupName}" are now ${this.groupToggleState[groupName] ? "ENABLED" : "DISABLED"}.`);
        this._onDidChangeTreeData.fire();
    }
    saveGroups() {
        const serializedGroups = Object.keys(this.groups).reduce((acc, groupName) => {
            acc[groupName] = this.groups[groupName]
                .filter((bp) => bp instanceof vscode.SourceBreakpoint) // Only store valid breakpoints
                .map((bp) => ({
                uri: bp.location.uri.toString(),
                line: bp.location.range.start.line,
                enabled: bp.enabled, // Store enabled state
            }));
            return acc;
        }, {});
        this.context.globalState.update("breakpointGroups", JSON.stringify(serializedGroups));
    }
    loadGroups() {
        const savedData = this.context.globalState.get("breakpointGroups", "{}");
        try {
            const parsedData = JSON.parse(savedData);
            this.groups = Object.keys(parsedData).reduce((acc, groupName) => {
                acc[groupName] = parsedData[groupName].map((bpData) => {
                    const bp = new vscode.SourceBreakpoint(new vscode.Location(vscode.Uri.parse(bpData.uri), new vscode.Position(bpData.line, 0)), bpData.enabled);
                    // Ensure the toggle state reflects the real enabled state
                    if (this.groupToggleState[groupName] === undefined) {
                        this.groupToggleState[groupName] = bpData.enabled;
                    }
                    return bp;
                });
                return acc;
            }, {});
            if (!this.groups["Ungrouped"]) {
                this.groups["Ungrouped"] = [];
            }
            // Remove any toggle states for groups that no longer exist
            Object.keys(this.groupToggleState).forEach((groupName) => {
                if (!this.groups[groupName]) {
                    delete this.groupToggleState[groupName];
                }
            });
            this.context.globalState.update("groupToggleState", this.groupToggleState);
            vscode.debug.removeBreakpoints(vscode.debug.breakpoints);
            vscode.debug.addBreakpoints(Object.values(this.groups)
                .flat()
                .filter((bp) => bp instanceof vscode.SourceBreakpoint));
        }
        catch (error) {
            console.error("Error loading saved breakpoints:", error);
            this.groups = { Ungrouped: [] };
        }
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map
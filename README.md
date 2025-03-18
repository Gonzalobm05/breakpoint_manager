# Breakpoint Groups - VS Code Extension

## Overview
The **Breakpoint Groups** extension enhances the debugging experience in VS Code by allowing users to organize breakpoints into custom groups. Users can create, rename, delete, and toggle groups of breakpoints, making it easier to manage breakpoints in large projects.

---

## Features
- Create and manage custom breakpoint groups.
- Automatically assign new breakpoints to the selected group.
- Enable or disable all breakpoints within a group with one toggle.
- Move breakpoints between groups using an interactive UI.
- Persistent storage of groups and breakpoints across VS Code sessions.

---

## Installation
1. Clone or download this repository.
2. Open the project in VS Code.
3. Run `npm install` to install dependencies.
4. Press `F5` to launch the extension in a new VS Code window.

---

## Available Commands and UI Controls

### **Adding a Breakpoint Group**
![](resources\create_group.gif)
**How to use:**  
1. Click the **"Add Breakpoint Group"** button.
2. Enter a name for the new group when prompted.
3. The new group will appear in the list.

---

### **Renaming a Breakpoint Group**
![](resources\rename_group.gif)
**How to use:**  
1. Click the **Pencil icon (![](resources\Light\edit.svg) / ![](resources\Dark\edit.svg))** next to the group you want to rename.
2. Enter a new name in the prompt.
3. The group will update with the new name.

---

### **Deleting a Breakpoint Group**
![](resources\delete_group.gif)
**How to use:**  
1. Click the **Trash icon (![](resources\Light\trash.svg) / ![](resources\Dark\trash.svg))** next to the group you want to delete.
2. The group will be removed.
3. Any breakpoints from the deleted group will be moved to **"Ungrouped"**.

---

### **Toggling Breakpoints in a Group**
![](resources\toggle_breakpoint.gif)
**How to use:**  
1. Click the **Activate Breakpoint icon** ![](resources\Dark\activate-breakpoints.svg) /![](resources\Light\activate-breakpoints.svg) next to the group.
   - If the icon is **hollow (![](resources\Light\circle-outline.svg)/![](resources\Dark\circle-outline.svg))** → Breakpoints are **disabled**.
   - If the icon is a **filled (![](resources\Light\circle-filled.svg)/![](resources\Dark\circle-filled.svg))** → Breakpoints are **enabled**.
2. Clicking the icon toggles all breakpoints in that group ON or OFF.

---

### **Deleting a Breakpoint**
![](resources\remove_breakpoint.gif)
**How to use:**  
1. Click the **Trash icon (![](resources\Light\trash.svg) / ![](resources\Dark\trash.svg))** next to the breakpoint you want to remove.
2. The breakpoint will be removed from the list and the code.

---

### **Moving a Breakpoint to Another Group**
![](resources\rename_group.gif)
**How to use:**  
1. Click the **Arrow icon (![](resources\Light\arrow-right.svg) / ![](resources\Dark\arrow-right.svg))** next to the breakpoint you want to move.
2. Select the **destination group** from the prompt.
3. The breakpoint will be moved to the selected group.

---

### **Selecting a Group**
![](resources\add_breakpoint.gif)
**How to use:**  
1. Click on a **group name** in the list.
2. Any new breakpoints added by clicking a line number in the editor will automatically be assigned to the selected group.

---

## **Usage Notes**
- If no group is selected, new breakpoints are added to the **Ungrouped** category.
- Breakpoints persist across VS Code sessions.
- Groups and their enabled/disabled states are saved automatically.

---

## Issues and Contributions
If you encounter any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

---

## License
This extension is open-source and licensed under the MIT License.
